import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/mongodb';
import { cache } from '../../../lib/cache';
import { jsonOk } from '../../../lib/apiResponse';
import { isGameImageProxyUrl, toPublicGames, toPublicGameImage } from '../../../lib/gameImages';

// GET all games
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const distributorId = searchParams.get('distributorId');
    const includeInactive = searchParams.get('includeInactive') === 'true' || Boolean(searchParams.get('adminRole'));

    const cacheKey = distributorId
      ? `games_${distributorId}`
      : includeInactive
        ? 'games_all_include_inactive'
        : 'games_all_public';
    const cachedGames = cache.get(cacheKey);
    if (cachedGames) {
      return jsonOk(
        { success: true, games: cachedGames },
        { cacheSeconds: distributorId ? 60 : 120, scope: 'public' }
      );
    }

    const db = await getDb();
    const gamesCollection = db.collection('games');
    
    // Efficiently fetch games metadata without downloading 46MB of base64 images in bulk
    const rawGames = await gamesCollection.aggregate([
      {
        $project: {
          _id: 0,
          id: 1,
          title: 1,
          badge: 1,
          link: 1,
          openPanelLink: 1,
          category: 1,
          availableCoins: 1,
          usedCoins: 1,
          isHot: 1,
          isNew: 1,
          isMaintenance: 1,
          active: { $ifNull: ["$active", true] },
          imagePrefix: { $substrCP: [{ $ifNull: ["$image", ""] }, 0, 30] },
          imageLength: { $strLenCP: [{ $ifNull: ["$image", ""] }] },
          staticImage: {
            $cond: [
              { $regexMatch: { input: { $ifNull: ["$image", ""] }, regex: /^data:/ } },
              null,
              "$image"
            ]
          }
        }
      }
    ]).toArray();

    const filteredRawGames = includeInactive ? rawGames : rawGames.filter(g => g.active !== false);

    const games = filteredRawGames.map((g) => {
      let img = g.staticImage || g.imagePrefix || '';
      if (typeof g.imagePrefix === 'string' && g.imagePrefix.startsWith('data:image')) {
        img = `/api/games/image?id=${encodeURIComponent(g.id)}&v=${g.imageLength || 1}`;
      }
      const { imagePrefix, imageLength, staticImage, ...rest } = g;
      return { ...rest, image: img };
    });
    
    if (distributorId) {
      const distGames = await db.collection('distributorGames').find({ distributorId }).toArray();
      const distGamesMap = {};
      distGames.forEach(dg => {
        distGamesMap[dg.gameId] = dg;
      });

      const mappedGames = games.map(game => {
        const dg = distGamesMap[game.id];
        return {
          ...game,
          availableCoins: dg ? (dg.availableCoins || 0) : 0,
          usedCoins: dg ? (dg.usedCoins || 0) : 0,
          openPanelLink: dg ? (dg.openPanelLink || game.openPanelLink || game.link) : (game.openPanelLink || game.link)
        };
      });
      cache.set(cacheKey, mappedGames, 60);
      return jsonOk(
        { success: true, games: mappedGames },
        { cacheSeconds: 60, scope: 'public' }
      );
    }

    cache.set(cacheKey, games, 300);
    return jsonOk(
      { success: true, games },
      { cacheSeconds: 120, scope: 'public' }
    );
  } catch (err) {
    console.error('Fetch Games API Error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}

// POST new game (Admin action)
export async function POST(req) {
  try {
    const game = await req.json();
    if (!game.title || !game.link) {
      return NextResponse.json({ success: false, message: 'Title and link are required fields.' }, { status: 400 });
    }

    const db = await getDb();
    const gamesCollection = db.collection('games');

    const newGame = {
      id: game.id || Date.now().toString(),
      title: game.title,
      badge: game.badge || 'none',
      image: game.image || 'placeholder_1',
      link: game.link,
      openPanelLink: game.openPanelLink || '',
      availableCoins: Number(game.availableCoins || 0),
      usedCoins: 0,
      active: game.active !== undefined ? Boolean(game.active) : true
    };

    await gamesCollection.insertOne(newGame);
    
    // Invalidate caches
    cache.del('games_all');
    cache.del('games_all_public');
    cache.del('games_all_include_inactive');
    cache.del(`game_image_${newGame.id}`);
    
    return NextResponse.json({ success: true, game: { ...newGame, image: toPublicGameImage(newGame) }, message: 'Game added successfully!' });
  } catch (err) {
    console.error('Create Game API Error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}

// PUT (update) game (Admin action)
export async function PUT(req) {
  try {
    const game = await req.json();
    if (!game.id) {
      return NextResponse.json({ success: false, message: 'Game ID is required.' }, { status: 400 });
    }

    const db = await getDb();
    const gamesCollection = db.collection('games');

    if (game.distributorId) {
      const updateDoc = {
        distributorId: game.distributorId,
        gameId: game.id,
        availableCoins: game.availableCoins !== undefined ? Number(game.availableCoins) : 0,
        openPanelLink: game.openPanelLink || ''
      };
      if (game.resetUsedCoins) {
        updateDoc.usedCoins = 0;
      }
      await db.collection('distributorGames').updateOne(
        { distributorId: game.distributorId, gameId: game.id },
        { $set: updateDoc },
        { upsert: true }
      );
      cache.del(`games_${game.distributorId}`);
      return NextResponse.json({ success: true, message: 'Distributor game pool updated successfully!' });
    }

    const updateFields = {
      title: game.title,
      badge: game.badge,
      image: game.image,
      link: game.link,
      openPanelLink: game.openPanelLink,
      availableCoins: game.availableCoins !== undefined ? Number(game.availableCoins) : undefined,
      active: game.active !== undefined ? Boolean(game.active) : undefined
    };

    if (game.resetUsedCoins) {
      updateFields.usedCoins = 0;
    }

    // Admin edit form may send the public proxy URL if the cover was not re-uploaded.
    // Never persist that URL over the real base64 / file path in Mongo.
    if (isGameImageProxyUrl(updateFields.image)) {
      delete updateFields.image;
    }

    // Clean undefined fields
    Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);

    await gamesCollection.updateOne({ id: game.id }, { $set: updateFields });
    
    // Invalidate caches
    cache.del('games_all');
    cache.del('games_all_public');
    cache.del(`game_image_${game.id}`);

    return NextResponse.json({ success: true, message: 'Game updated successfully!' });
  } catch (err) {
    console.error('Update Game API Error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}

// DELETE game (Admin action)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Game ID parameter is required.' }, { status: 400 });
    }

    const db = await getDb();
    const gamesCollection = db.collection('games');

    await gamesCollection.deleteOne({ id });
    
    // Invalidate caches
    cache.del('games_all');
    cache.del('games_all_public');
    cache.del(`game_image_${id}`);

    return NextResponse.json({ success: true, message: 'Game deleted successfully!' });
  } catch (err) {
    console.error('Delete Game API Error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}


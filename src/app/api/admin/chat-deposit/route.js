import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';
import { cache } from '../../../../lib/cache';
import { publishAdminEvent } from '../../../../lib/adminEvents';
import { notifyUserAsync } from '../../../../lib/userAlertService';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      userEmail,
      depositAmount,
      gateway,
      gatewayTag = '',
      senderTag = '',
      gameTitle,
      coinsLoaded,
      bonusPercent = 0,
      bonusAmount = 0,
      gameUsername,
      gamePassword,
      createOrUpdateAccount = true,
      postToChat = true,
      note = '',
      adminEmail = '',
      adminName = '',
      adminRole = ''
    } = body;

    // Validate minimum required fields
    if (!userEmail || !depositAmount || !gateway || !gameTitle || !coinsLoaded) {
      return NextResponse.json({
        success: false,
        message: 'Missing required deposit or game details (User, Amount, Gateway, Game, Coins).'
      }, { status: 400 });
    }

    const cleanEmail = String(userEmail).toLowerCase().trim();
    const numAmount = parseFloat(depositAmount);
    const numCoins = parseFloat(coinsLoaded);

    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Invalid deposit amount.'
      }, { status: 400 });
    }

    if (isNaN(numCoins) || numCoins <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Invalid coins amount.'
      }, { status: 400 });
    }

    const db = await getDb();

    // Fetch player profile
    const userDoc = await db.collection('users').findOne({ email: cleanEmail });
    const distId = userDoc ? (userDoc.distributorId || '') : '';

    const txId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
    const nowIso = new Date().toISOString();
    const staffLabel = adminName ? `${adminName} (${adminEmail || 'Staff'})` : (adminEmail || 'Support Agent');

    // 1. Insert completed DEPOSIT Transaction
    const newTx = {
      id: txId,
      userEmail: cleanEmail,
      type: 'DEPOSIT',
      status: 'SUCCESS',
      amount: numAmount,
      coinsAllotted: numCoins,
      bonusApplied: parseFloat(bonusAmount) || 0,
      bonusPercent: parseFloat(bonusPercent) || 0,
      gateway: String(gateway).trim(),
      receiverTag: String(gatewayTag).trim(),
      senderTag: String(senderTag).trim(),
      gameTitle: String(gameTitle).trim(),
      gameUsername: String(gameUsername || '').trim(),
      source: 'CHAT_SUPPORT',
      processedBy: staffLabel,
      adminEmail: adminEmail,
      distributorId: distId,
      note: note ? `Live Chat Deposit: ${note}` : `Live Chat Deposit received by ${staffLabel}`,
      coinsAllottedAt: nowIso,
      timestamp: nowIso,
      createdAt: new Date()
    };

    await db.collection('transactions').insertOne(newTx);

    // 2. Create or Update Game Credentials
    let credsUpdated = false;
    if (createOrUpdateAccount && gameUsername && gamePassword) {
      const cleanTitle = String(gameTitle).trim();
      const titleRegex = new RegExp(`^${cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

      const existingAccount = await db.collection('gameAccounts').findOne({
        userEmail: cleanEmail,
        gameTitle: titleRegex
      });

      if (existingAccount) {
        await db.collection('gameAccounts').updateOne(
          { _id: existingAccount._id },
          {
            $set: {
              username: String(gameUsername).trim(),
              password: String(gamePassword).trim(),
              status: 'READY',
              updatedAt: nowIso,
              lastLoadedCoins: numCoins,
              lastLoadedAt: nowIso
            }
          }
        );
      } else {
        await db.collection('gameAccounts').insertOne({
          userEmail: cleanEmail,
          gameTitle: cleanTitle,
          username: String(gameUsername).trim(),
          password: String(gamePassword).trim(),
          status: 'READY',
          createdAt: nowIso,
          updatedAt: nowIso,
          lastLoadedCoins: numCoins,
          lastLoadedAt: nowIso
        });
      }

      // Mark any pending account requests for this game as READY
      await db.collection('accountRequests').updateMany(
        {
          userEmail: cleanEmail,
          gameTitle: titleRegex,
          status: { $in: ['PENDING', 'READY'] }
        },
        {
          $set: {
            status: 'READY',
            gameAccountUsername: String(gameUsername).trim(),
            gameAccountPassword: String(gamePassword).trim(),
            processedBy: staffLabel,
            updatedAt: nowIso
          }
        }
      );

      credsUpdated = true;
    }

    // 3. Insert completed Coins Notification record for audit and shift totals
    const notiId = Date.now().toString() + Math.floor(Math.random() * 100).toString();
    await db.collection('coinsNotifications').insertOne({
      id: notiId,
      userEmail: cleanEmail,
      gameTitle: String(gameTitle).trim(),
      depositAmount: numAmount,
      totalCoins: numCoins,
      bonusApplied: parseFloat(bonusAmount) || 0,
      status: 'COMPLETED',
      read: true,
      processedBy: staffLabel,
      timestamp: nowIso,
      transactionId: txId,
      distributorId: distId,
      source: 'CHAT_SUPPORT'
    });

    // 4. Send Confirmation Receipt in Support Chat Thread
    let chatMsgId = null;
    if (postToChat) {
      chatMsgId = Date.now().toString() + Math.floor(Math.random() * 100).toString();
      const receiptMessage = [
        `🎉 **DEPOSIT & GAME CREDITS CONFIRMED!** ✅`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `💵 **Deposit Received:** $${numAmount.toFixed(2)} via **${gateway}**${gatewayTag ? ` (${gatewayTag})` : ''}`,
        `🎮 **Game Platform:** ${gameTitle}`,
        `🪙 **Coins Credited:** **${numCoins} Coins**${bonusAmount > 0 ? ` (Includes $${bonusAmount} Bonus)` : ''}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        gameUsername ? `🔑 **YOUR GAME CREDENTIALS:**\n👤 **Username:** \`${gameUsername}\`\n🔐 **Password:** \`${gamePassword}\`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━` : '',
        `✨ Your coins have been loaded and your account is ready to play. Good luck and have fun! 🚀`
      ].filter(Boolean).join('\n');

      const supportDoc = {
        id: chatMsgId,
        userEmail: cleanEmail,
        userName: userDoc?.name || 'Player',
        message: receiptMessage,
        senderType: 'admin',
        senderEmail: adminEmail || 'support@winningheaven.com',
        read: false,
        timestamp: nowIso,
        distributorId: distId,
        isSystemReceipt: true,
        transactionId: txId
      };

      await db.collection('supportMessages').insertOne(supportDoc);

      // Alert user via Push / User Alert service
      notifyUserAsync(db, {
        userEmail: cleanEmail,
        title: 'Deposit & Game Coins Confirmed!',
        body: `Your deposit of $${numAmount.toFixed(2)} for ${gameTitle} (${numCoins} Coins) is ready!`,
        actionUrl: '/lobby?tab=history'
      });
    }

    // Invalidate stats cache
    cache.del('admin_stats');

    publishAdminEvent({
      type: 'DIRECT_CHAT_DEPOSIT_COMPLETED',
      userEmail: cleanEmail,
      amount: numAmount,
      coins: numCoins,
      gameTitle,
      processedBy: staffLabel
    });

    return NextResponse.json({
      success: true,
      message: 'Deposit confirmed and game credentials issued successfully!',
      transactionId: txId,
      gameAccount: {
        gameTitle,
        username: gameUsername,
        password: gamePassword
      },
      chatMessageId: chatMsgId
    });
  } catch (err) {
    console.error('Chat Deposit API Error:', err);
    return NextResponse.json({
      success: false,
      message: 'Server error processing chat deposit: ' + err.message
    }, { status: 500 });
  }
}

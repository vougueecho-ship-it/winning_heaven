import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/mongodb';
import { cache } from '../../../lib/cache';

// GET settings
export async function GET() {
  try {
    const cachedSettings = cache.get('settings_all');
    if (cachedSettings) {
      return NextResponse.json({ success: true, settings: cachedSettings });
    }

    const db = await getDb();
    const settingsCollection = db.collection('settings');
    
    let settings = await settingsCollection.findOne({ id: 'global_settings' });
    
    // Seed defaults if missing
    if (!settings) {
      settings = {
        id: 'global_settings',
        firstDepositBonus: 300,
        regularDepositBonus: 20,
        referralBonus: 10,
        freeplayMinWithdraw: 30,
        defaultMinWithdraw: 25,
        withdrawTier1Multiplier: 5,
        withdrawTier2Multiplier: 3,
        withdrawTier1MinDeposit: 5,
        withdrawTier1MaxDeposit: 50,
        usdtAddress: '',
        usdtQrCode: '',
        affiliatePayoutNetwork: 'TRC20',
        affiliatePayoutWallet: '',
        affiliatePayoutQrCode: '',
        affiliatePayoutWalletBEP20: '',
        affiliatePayoutQrBEP20: '',
        affiliatePlatformCommissionRate: 90,
        adPaymentNetwork: 'BEP20',
        adPaymentWallet: '',
        adPaymentQrCode: '',
        adBudgetLimit: 6000
      };
      await settingsCollection.insertOne(settings);
    } else {
      let needsUpdate = false;
      const updates = {};
      if (settings.referralBonus === undefined) {
        updates.referralBonus = 10;
        settings.referralBonus = 10;
        needsUpdate = true;
      }
      if (settings.freeplayMinWithdraw === undefined) {
        updates.freeplayMinWithdraw = 30;
        settings.freeplayMinWithdraw = 30;
        needsUpdate = true;
      }
      if (settings.defaultMinWithdraw === undefined) {
        updates.defaultMinWithdraw = 25;
        settings.defaultMinWithdraw = 25;
        needsUpdate = true;
      }
      if (settings.withdrawTier1Multiplier === undefined) {
        updates.withdrawTier1Multiplier = 5;
        settings.withdrawTier1Multiplier = 5;
        needsUpdate = true;
      }
      if (settings.withdrawTier2Multiplier === undefined) {
        updates.withdrawTier2Multiplier = 3;
        settings.withdrawTier2Multiplier = 3;
        needsUpdate = true;
      }
      if (settings.withdrawTier1MinDeposit === undefined) {
        updates.withdrawTier1MinDeposit = 5;
        settings.withdrawTier1MinDeposit = 5;
        needsUpdate = true;
      }
      if (settings.withdrawTier1MaxDeposit === undefined) {
        updates.withdrawTier1MaxDeposit = 50;
        settings.withdrawTier1MaxDeposit = 50;
        needsUpdate = true;
      }
      if (settings.usdtAddress === undefined) {
        updates.usdtAddress = '';
        settings.usdtAddress = '';
        needsUpdate = true;
      }
      if (settings.usdtQrCode === undefined) {
        updates.usdtQrCode = '';
        settings.usdtQrCode = '';
        needsUpdate = true;
      }
      if (settings.affiliatePayoutNetwork === undefined) {
        updates.affiliatePayoutNetwork = 'TRC20';
        settings.affiliatePayoutNetwork = 'TRC20';
        needsUpdate = true;
      }
      if (settings.affiliatePayoutWallet === undefined) {
        updates.affiliatePayoutWallet = '';
        settings.affiliatePayoutWallet = '';
        needsUpdate = true;
      }
      if (settings.affiliatePayoutQrCode === undefined) {
        updates.affiliatePayoutQrCode = '';
        settings.affiliatePayoutQrCode = '';
        needsUpdate = true;
      }
      if (settings.affiliatePlatformCommissionRate === undefined) {
        updates.affiliatePlatformCommissionRate = 90;
        settings.affiliatePlatformCommissionRate = 90;
        needsUpdate = true;
      }
      ['affiliatePayoutWalletBEP20', 'affiliatePayoutQrBEP20', 'adPaymentNetwork', 'adPaymentWallet', 'adPaymentQrCode'].forEach((key) => {
        if (settings[key] === undefined) {
          updates[key] = '';
          settings[key] = '';
          needsUpdate = true;
        }
      });
      if (settings.adBudgetLimit === undefined) {
        updates.adBudgetLimit = 6000;
        settings.adBudgetLimit = 6000;
        needsUpdate = true;
      }
      if (settings.enforceDeviceLimit === undefined) {
        updates.enforceDeviceLimit = true;
        settings.enforceDeviceLimit = true;
        needsUpdate = true;
      }
      if (needsUpdate) {
        await settingsCollection.updateOne({ id: 'global_settings' }, { $set: updates });
      }
    }
    
    cache.set('settings_all', settings, 60);
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    console.error('Fetch Settings API Error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}

// PUT / POST update settings (Super Admin only)
export async function PUT(req) {
  try {
    const {
      firstDepositBonus,
      regularDepositBonus,
      referralBonus,
      freeplayMinWithdraw,
      defaultMinWithdraw,
      withdrawTier1Multiplier,
      withdrawTier2Multiplier,
      withdrawTier1MinDeposit,
      withdrawTier1MaxDeposit,
      usdtAddress,
      usdtQrCode,
      affiliatePayoutNetwork,
      affiliatePayoutWallet,
      affiliatePayoutQrCode,
      affiliatePayoutWalletBEP20,
      affiliatePayoutQrBEP20,
      affiliatePlatformCommissionRate,
      adPaymentNetwork,
      adPaymentWallet,
      adPaymentQrCode,
      adBudgetLimit,
      enforceDeviceLimit
    } = await req.json();

    const db = await getDb();
    const settingsCollection = db.collection('settings');

    const updateFields = {};
    if (firstDepositBonus !== undefined) {
      updateFields.firstDepositBonus = Number(firstDepositBonus);
    }
    if (regularDepositBonus !== undefined) {
      updateFields.regularDepositBonus = Number(regularDepositBonus);
    }
    if (referralBonus !== undefined) {
      updateFields.referralBonus = Number(referralBonus);
    }
    if (freeplayMinWithdraw !== undefined) {
      updateFields.freeplayMinWithdraw = Number(freeplayMinWithdraw);
    }
    if (defaultMinWithdraw !== undefined) {
      updateFields.defaultMinWithdraw = Number(defaultMinWithdraw);
    }
    if (withdrawTier1Multiplier !== undefined) {
      updateFields.withdrawTier1Multiplier = Number(withdrawTier1Multiplier);
    }
    if (withdrawTier2Multiplier !== undefined) {
      updateFields.withdrawTier2Multiplier = Number(withdrawTier2Multiplier);
    }
    if (withdrawTier1MinDeposit !== undefined) {
      updateFields.withdrawTier1MinDeposit = Number(withdrawTier1MinDeposit);
    }
    if (withdrawTier1MaxDeposit !== undefined) {
      updateFields.withdrawTier1MaxDeposit = Number(withdrawTier1MaxDeposit);
    }
    if (usdtAddress !== undefined) {
      updateFields.usdtAddress = String(usdtAddress).trim();
    }
    if (usdtQrCode !== undefined) {
      updateFields.usdtQrCode = String(usdtQrCode);
    }
    if (affiliatePayoutNetwork !== undefined) {
      updateFields.affiliatePayoutNetwork = ['TRC20', 'BEP20'].includes(affiliatePayoutNetwork) ? affiliatePayoutNetwork : 'TRC20';
    }
    if (affiliatePayoutWallet !== undefined) {
      updateFields.affiliatePayoutWallet = String(affiliatePayoutWallet).trim();
    }
    if (affiliatePayoutQrCode !== undefined) {
      updateFields.affiliatePayoutQrCode = String(affiliatePayoutQrCode);
    }
    if (affiliatePayoutWalletBEP20 !== undefined) {
      updateFields.affiliatePayoutWalletBEP20 = String(affiliatePayoutWalletBEP20).trim();
    }
    if (affiliatePayoutQrBEP20 !== undefined) {
      updateFields.affiliatePayoutQrBEP20 = String(affiliatePayoutQrBEP20);
    }
    if (affiliatePlatformCommissionRate !== undefined) {
      updateFields.affiliatePlatformCommissionRate = Number(affiliatePlatformCommissionRate) || 90;
    }
    if (adPaymentNetwork !== undefined) {
      updateFields.adPaymentNetwork = ['TRC20', 'BEP20'].includes(adPaymentNetwork) ? adPaymentNetwork : 'BEP20';
    }
    if (adPaymentWallet !== undefined) {
      updateFields.adPaymentWallet = String(adPaymentWallet).trim();
    }
    if (adPaymentQrCode !== undefined) {
      updateFields.adPaymentQrCode = String(adPaymentQrCode);
    }
    if (adBudgetLimit !== undefined) {
      updateFields.adBudgetLimit = Math.max(0, Number(adBudgetLimit) || 6000);
    }
    if (enforceDeviceLimit !== undefined) {
      updateFields.enforceDeviceLimit = Boolean(enforceDeviceLimit);
    }

    await settingsCollection.updateOne(
      { id: 'global_settings' },
      { $set: updateFields },
      { upsert: true }
    );

    // Sync shared fields to frontend_settings
    const syncToFrontend = {};
    if (updateFields.firstDepositBonus !== undefined) syncToFrontend.firstDepositBonus = Number(updateFields.firstDepositBonus);
    if (updateFields.freeplayMinWithdraw !== undefined) syncToFrontend.freeplayMinWithdraw = Number(updateFields.freeplayMinWithdraw);
    if (updateFields.defaultMinWithdraw !== undefined) syncToFrontend.defaultMinWithdraw = Number(updateFields.defaultMinWithdraw);
    if (updateFields.withdrawTier1Multiplier !== undefined) syncToFrontend.withdrawTier1Multiplier = Number(updateFields.withdrawTier1Multiplier);
    if (updateFields.withdrawTier2Multiplier !== undefined) syncToFrontend.withdrawTier2Multiplier = Number(updateFields.withdrawTier2Multiplier);
    if (updateFields.withdrawTier1MinDeposit !== undefined) syncToFrontend.withdrawTier1MinDeposit = Number(updateFields.withdrawTier1MinDeposit);
    if (updateFields.withdrawTier1MaxDeposit !== undefined) syncToFrontend.withdrawTier1MaxDeposit = Number(updateFields.withdrawTier1MaxDeposit);

    if (Object.keys(syncToFrontend).length > 0) {
      await settingsCollection.updateOne(
        { id: 'frontend_settings' },
        { $set: syncToFrontend },
        { upsert: true }
      );
      cache.del('frontend_settings_all');
    }

    // Invalidate caches
    cache.del('settings_all');
    cache.del('global_settings');
    cache.del('admin_stats'); // Settings can affect statistics/allotments

    return NextResponse.json({ success: true, message: 'Bonus settings updated successfully!' });
  } catch (err) {
    console.error('Update Settings API Error:', err);
    return NextResponse.json({ success: false, message: 'Server error: ' + err.message }, { status: 500 });
  }
}


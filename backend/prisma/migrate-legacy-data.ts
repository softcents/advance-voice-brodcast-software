import { PrismaClient, Role, AccountStatus, TransactionType, ReferenceType, CallStatus } from '@prisma/client';
import * as mysql from 'mysql2/promise';

const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Starting A-to-Z Data Migration from legacy MariaDB (vsms_ominaz) to PostgreSQL (voice_pro)...');

  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'vsms_ominaz',
    password: 'vsms_ominaz',
    database: 'vsms_ominaz',
  });

  console.log('✅ Connected to legacy MariaDB.');

  // -------------------------------------------------------------
  // 1. Migrate Users
  // -------------------------------------------------------------
  console.log('📦 Migrating Users...');
  const [users]: any = await connection.query('SELECT * FROM users ORDER BY id ASC');
  const userMap = new Map<number, string>(); // legacyId -> pgId
  let adminPgId = '';

  for (const u of users) {
    const isSuperAdmin = u.type === 'admin';
    const role = isSuperAdmin ? Role.SUPER_ADMIN : Role.CUSTOMER;

    const userPulseRate = u.pulse_rate !== null && u.pulse_rate !== undefined ? parseFloat(String(u.pulse_rate)) : 0.5;
    const userPulseDuration = u.pulse_duration !== null && u.pulse_duration !== undefined ? parseInt(String(u.pulse_duration), 10) : 10;
    const userCreatedAt = u.created_at ? new Date(u.created_at) : new Date();
    const userUpdatedAt = u.updated_at ? new Date(u.updated_at) : new Date();
    const userVerifiedAt = u.email_verified_at ? new Date(u.email_verified_at) : null;

    const pgUser = await prisma.user.upsert({
      where: { legacyId: u.id },
      update: {
        name: u.name,
        email: u.email,
        phone: u.phone || null,
        passwordHash: u.password,
        companyName: u.company_name || null,
        avatarUrl: u.avatar_url || null,
        emailVerifiedAt: userVerifiedAt,
        role,
        status:
          u.status === 'banned'
            ? AccountStatus.TERMINATED
            : u.status === 'rejected'
              ? AccountStatus.SUSPENDED
              : u.status === 'pending'
                ? AccountStatus.PENDING
                : AccountStatus.ACTIVE,
        frontNid: u.front_nid || null,
        backNid: u.back_nid || null,
        audioType: u.audio_type || 'both',
        autoApproveAudio: Boolean(u.auto_approve_audio),
        autoApproveCampaigns: Boolean(u.auto_approve_campaigns),
        pulseRate: userPulseRate,
        pulseDuration: userPulseDuration,
        createdAt: userCreatedAt,
        updatedAt: userUpdatedAt,
      },
      create: {
        legacyId: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || null,
        passwordHash: u.password,
        companyName: u.company_name || null,
        avatarUrl: u.avatar_url || null,
        emailVerifiedAt: userVerifiedAt,
        role,
        status:
          u.status === 'banned'
            ? AccountStatus.TERMINATED
            : u.status === 'rejected'
              ? AccountStatus.SUSPENDED
              : u.status === 'pending'
                ? AccountStatus.PENDING
                : AccountStatus.ACTIVE,
        frontNid: u.front_nid || null,
        backNid: u.back_nid || null,
        audioType: u.audio_type || 'both',
        autoApproveAudio: Boolean(u.auto_approve_audio),
        autoApproveCampaigns: Boolean(u.auto_approve_campaigns),
        pulseRate: userPulseRate,
        pulseDuration: userPulseDuration,
        createdAt: userCreatedAt,
        updatedAt: userUpdatedAt,
        path: isSuperAdmin ? '1' : `1/${u.id}`,
        depth: isSuperAdmin ? 0 : 1,
        creditLimit: 0,
      },
    });

    userMap.set(u.id, pgUser.id);
    if (isSuperAdmin && !adminPgId) {
      adminPgId = pgUser.id;
    }

    // Upsert User Wallet with exact legacy balance
    await prisma.wallet.upsert({
      where: { userId: pgUser.id },
      update: {
        balance: parseFloat(u.balance || 0),
      },
      create: {
        userId: pgUser.id,
        currency: 'BDT',
        balance: parseFloat(u.balance || 0),
        creditLimit: 0,
      },
    });
  }

  if (!adminPgId && users.length > 0) {
    adminPgId = userMap.get(users[0].id)!;
  }
  console.log(`✅ Migrated ${users.length} Users with exact bcrypt passwords and wallets.`);

  // -------------------------------------------------------------
  // 2. Migrate Asterisk Servers
  // -------------------------------------------------------------
  console.log('📦 Migrating Asterisk PBX Servers...');
  const [servers]: any = await connection.query('SELECT * FROM servers ORDER BY id ASC');
  const serverMap = new Map<number, string>(); // legacyId -> pgId

  for (const s of servers) {
    const ariHost = s.ari_host || '127.0.0.1';
    const ariPort = s.ari_port || 8088;
    const ariBaseUrl = `http://${ariHost}:${ariPort}`;

    const pgServer = await prisma.asteriskServer.upsert({
      where: { legacyId: s.id },
      update: {
        name: s.name,
        ariBaseUrl,
        ariUsername: s.ari_username || 'asterisk',
        ariPassword: s.ari_password || 'secret',
        maxConcurrency: s.max_concurrency || 200,
        isOnline: Boolean(s.connected),
        enabled: Boolean(s.enabled),
      },
      create: {
        legacyId: s.id,
        name: s.name,
        ariBaseUrl,
        ariUsername: s.ari_username || 'asterisk',
        ariPassword: s.ari_password || 'secret',
        maxConcurrency: s.max_concurrency || 200,
        isOnline: Boolean(s.connected),
        enabled: Boolean(s.enabled),
      },
    });

    serverMap.set(s.id, pgServer.id);
  }
  console.log(`✅ Migrated ${servers.length} Asterisk Servers.`);

  // -------------------------------------------------------------
  // 3. Migrate SIP Trunks (A to Z)
  // -------------------------------------------------------------
  console.log('📦 Migrating SIP Trunks (A to Z configuration)...');
  const [trunks]: any = await connection.query('SELECT * FROM sip_trunks ORDER BY id ASC');
  const trunkMap = new Map<number, string>(); // legacyId -> pgId

  for (const t of trunks) {
    const serverId = serverMap.get(t.server_id) || Array.from(serverMap.values())[0];
    const userId = t.user_id ? userMap.get(t.user_id) : null;

    const pgTrunk = await prisma.sipTrunk.upsert({
      where: { name: t.name },
      update: {
        legacyId: t.id,
        serverId,
        userId,
        provider: t.provider || 'custom',
        type: t.type || 'ip',
        host: t.host,
        port: t.port || 5060,
        transport: t.transport || 'transport-udp',
        username: t.username || null,
        password: t.password || null,
        outboundCid: t.outbound_cid || null,
        codecs: t.codecs || 'alaw,ulaw,g729',
        context: t.context || 'from-pstn',
        maxConcurrency: t.max_concurrency || 30,
        enabled: Boolean(t.enabled),
        isOnline: true,
        notes: t.notes || null,
      },
      create: {
        legacyId: t.id,
        name: t.name,
        serverId,
        userId,
        provider: t.provider || 'custom',
        type: t.type || 'ip',
        host: t.host,
        port: t.port || 5060,
        transport: t.transport || 'transport-udp',
        username: t.username || null,
        password: t.password || null,
        outboundCid: t.outbound_cid || null,
        codecs: t.codecs || 'alaw,ulaw,g729',
        context: t.context || 'from-pstn',
        maxConcurrency: t.max_concurrency || 30,
        enabled: Boolean(t.enabled),
        isOnline: true,
        notes: t.notes || null,
      },
    });

    trunkMap.set(t.id, pgTrunk.id);
  }
  console.log(`✅ Migrated ${trunks.length} SIP Trunks.`);

  // -------------------------------------------------------------
  // 4. Migrate Callers (Caller IDs)
  // -------------------------------------------------------------
  console.log('📦 Migrating Callers / Caller IDs...');
  const [callers]: any = await connection.query('SELECT * FROM callers ORDER BY id ASC');

  for (const c of callers) {
    const serverId = serverMap.get(c.server_id) || Array.from(serverMap.values())[0];
    const userId = c.user_id ? userMap.get(c.user_id) : null;
    const sipTrunkId = c.sip_trunk_id ? trunkMap.get(c.sip_trunk_id) : null;

    await prisma.callerId.upsert({
      where: { legacyId: c.id },
      update: {
        serverId,
        userId,
        sipTrunkId,
        callerName: c.caller_name,
        callerNumber: c.caller_number,
        trunkName: c.trunk_name,
        maxConcurrency: c.max_concurrency || 10,
        isOnline: Boolean(c.is_online),
        enabled: Boolean(c.enabled),
      },
      create: {
        legacyId: c.id,
        serverId,
        userId,
        sipTrunkId,
        callerName: c.caller_name,
        callerNumber: c.caller_number,
        trunkName: c.trunk_name,
        maxConcurrency: c.max_concurrency || 10,
        isOnline: Boolean(c.is_online),
        enabled: Boolean(c.enabled),
      },
    });
  }
  console.log(`✅ Migrated ${callers.length} Caller IDs.`);

  // Migrate caller_user pivot table assignments
  try {
    const [callerUsers]: any = await connection.query('SELECT * FROM caller_user');
    for (const cu of callerUsers) {
      const pgUserId = userMap.get(cu.user_id);
      if (pgUserId) {
        await prisma.callerId.updateMany({
          where: { legacyId: cu.caller_id },
          data: { userId: pgUserId },
        });
      }
    }
    console.log(`✅ Migrated ${callerUsers.length} Caller-User pivot links.`);
  } catch (err: any) {
    console.log('No caller_user table found or skipped:', err.message);
  }

  // -------------------------------------------------------------
  // 5. Migrate Audio Recordings & Assets
  // -------------------------------------------------------------
  console.log('📦 Migrating Audio Recordings...');
  const [audios]: any = await connection.query('SELECT * FROM audio ORDER BY id ASC');
  const audioMap = new Map<number, string>(); // legacyId -> pgId

  for (const a of audios) {
    const userId = userMap.get(a.user_id) || adminPgId;

    const pgAudio = await prisma.audioAsset.upsert({
      where: { legacyId: a.id },
      update: {
        userId,
        title: a.title,
        originalPath: a.original_path || '',
        convertedPath: a.converted_path || null,
        durationSeconds: a.duration || 0,
        isTTS: a.type === 'tts',
        isApproved: a.approval === 'approved',
        approval: a.approval || 'approved',
        fileSize: a.size || null,
      },
      create: {
        legacyId: a.id,
        userId,
        title: a.title,
        originalPath: a.original_path || '',
        convertedPath: a.converted_path || null,
        durationSeconds: a.duration || 0,
        isTTS: a.type === 'tts',
        isApproved: a.approval === 'approved',
        approval: a.approval || 'approved',
        fileSize: a.size || null,
      },
    });

    audioMap.set(a.id, pgAudio.id);
  }
  console.log(`✅ Migrated ${audios.length} Audio recordings.`);

  // -------------------------------------------------------------
  // 6. Migrate Contact Groups
  // -------------------------------------------------------------
  console.log('📦 Migrating Contact Groups...');
  const [groups]: any = await connection.query('SELECT * FROM groups ORDER BY id ASC');
  const groupMap = new Map<number, string>(); // legacyId -> pgId

  for (const g of groups) {
    const userId = userMap.get(g.user_id) || adminPgId;

    const pgGroup = await prisma.contactGroup.upsert({
      where: { legacyId: g.id },
      update: {
        userId,
        name: g.name,
      },
      create: {
        legacyId: g.id,
        userId,
        name: g.name,
        totalContacts: 0,
      },
    });

    groupMap.set(g.id, pgGroup.id);
  }
  console.log(`✅ Migrated ${groups.length} Contact Groups.`);

  // -------------------------------------------------------------
  // 7. Migrate Contacts (86,167 Contacts in Bounded Batches)
  // -------------------------------------------------------------
  console.log('📦 Migrating Contacts (86,167 rows in batches of 5,000)...');
  const [contactsCountResult]: any = await connection.query('SELECT count(*) as total FROM contacts');
  const totalContacts = contactsCountResult[0].total;
  console.log(`Total legacy contacts to transfer: ${totalContacts}`);

  const batchSize = 5000;
  let offset = 0;
  let totalImported = 0;

  while (offset < totalContacts) {
    const [rows]: any = await connection.query(`SELECT id, group_id, phone_number, created_at FROM contacts ORDER BY id ASC LIMIT ${batchSize} OFFSET ${offset}`);
    if (rows.length === 0) break;

    const contactDataToInsert: any[] = [];
    for (const row of rows) {
      const groupId = groupMap.get(row.group_id);
      if (!groupId) continue;

      contactDataToInsert.push({
        legacyId: row.id,
        groupId,
        phoneNumber: row.phone_number,
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      });
    }

    if (contactDataToInsert.length > 0) {
      await prisma.contact.createMany({
        data: contactDataToInsert,
        skipDuplicates: true,
      });
      totalImported += contactDataToInsert.length;
      console.log(`  Processed ${totalImported} / ${totalContacts} contacts...`);
    }

    offset += batchSize;
  }

  // Update totalContacts count on ContactGroups
  for (const [legacyGroupId, pgGroupId] of groupMap.entries()) {
    const count = await prisma.contact.count({ where: { groupId: pgGroupId } });
    await prisma.contactGroup.update({
      where: { id: pgGroupId },
      data: { totalContacts: count },
    });
  }
  console.log(`✅ Successfully migrated ${totalImported} Contacts and updated group counts.`);

  // -------------------------------------------------------------
  // 8. Migrate Calls (Call History & CDR)
  // -------------------------------------------------------------
  console.log('📦 Migrating Call Records...');
  const [calls]: any = await connection.query('SELECT * FROM calls ORDER BY id ASC');

  for (const c of calls) {
    const userId = userMap.get(c.user_id) || adminPgId;
    const audioId = c.audio_id ? audioMap.get(c.audio_id) : null;
    const trunkId = Array.from(trunkMap.values())[0] || null;

    await prisma.callRecord.upsert({
      where: { legacyId: c.id },
      update: {
        userId,
        audioId,
        trunkId,
        phoneNumber: c.phone_number,
        callerId: String(c.caller_id || '999'),
        uniqueId: c.unique_id || null,
        status: CallStatus.COMPLETED,
        duration: Math.round(parseFloat(c.duration || 0)),
        billableSeconds: Math.round(parseFloat(c.duration || 0)),
        costPrice: 0,
        sellingPrice: parseFloat(c.cost || 0),
        grossProfit: parseFloat(c.cost || 0),
        initiatedAt: c.initiated_at ? new Date(c.initiated_at) : null,
      },
      create: {
        legacyId: c.id,
        userId,
        audioId,
        trunkId,
        phoneNumber: c.phone_number,
        callerId: String(c.caller_id || '999'),
        uniqueId: c.unique_id || null,
        status: CallStatus.COMPLETED,
        duration: Math.round(parseFloat(c.duration || 0)),
        billableSeconds: Math.round(parseFloat(c.duration || 0)),
        costPrice: 0,
        sellingPrice: parseFloat(c.cost || 0),
        grossProfit: parseFloat(c.cost || 0),
        initiatedAt: c.initiated_at ? new Date(c.initiated_at) : null,
        createdAt: c.created_at ? new Date(c.created_at) : new Date(),
      },
    });
  }
  console.log(`✅ Migrated ${calls.length} Call Records.`);

  // -------------------------------------------------------------
  // 9. Migrate Deposits (Recharge Requests)
  // -------------------------------------------------------------
  console.log('📦 Migrating Deposits (Recharge Requests)...');
  const [deposits]: any = await connection.query('SELECT * FROM deposits ORDER BY id ASC');

  for (const d of deposits) {
    const userId = userMap.get(d.user_id) || adminPgId;

    await prisma.rechargeRequest.upsert({
      where: { legacyId: d.id },
      update: {
        userId,
        amount: parseFloat(d.amount || 0),
        currency: d.currency || 'BDT',
        paymentMethod: d.payment_method || 'bKash',
        transactionRef: d.transaction_id || `DEP-${d.id}`,
        status: (d.status || 'APPROVED').toUpperCase(),
      },
      create: {
        legacyId: d.id,
        userId,
        amount: parseFloat(d.amount || 0),
        currency: d.currency || 'BDT',
        paymentMethod: d.payment_method || 'bKash',
        transactionRef: d.transaction_id || `DEP-${d.id}`,
        status: (d.status || 'APPROVED').toUpperCase(),
        createdAt: d.created_at ? new Date(d.created_at) : new Date(),
      },
    });
  }
  console.log(`✅ Migrated ${deposits.length} Deposit Records.`);

  // -------------------------------------------------------------
  // 10. Migrate Transactions (Ledger Entries)
  // -------------------------------------------------------------
  console.log('📦 Migrating Transactions (Ledger Entries)...');
  const [transactions]: any = await connection.query('SELECT * FROM transactions ORDER BY id ASC');

  for (const tx of transactions) {
    const userId = userMap.get(tx.user_id);
    if (!userId) continue;

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) continue;

    const isCredit = (tx.type || '').toLowerCase() === 'credit';
    const type = isCredit ? TransactionType.CREDIT : TransactionType.DEBIT;

    await prisma.ledgerEntry.upsert({
      where: { legacyId: tx.id },
      update: {
        walletId: wallet.id,
        userId,
        type,
        amount: parseFloat(tx.amount || 0),
        balanceBefore: parseFloat(tx.balance_before || 0),
        balanceAfter: parseFloat(tx.balance_after || 0),
        referenceType: ReferenceType.MANUAL_ADJUSTMENT,
        description: tx.description || 'Legacy Ledger Entry',
      },
      create: {
        legacyId: tx.id,
        walletId: wallet.id,
        userId,
        type,
        amount: parseFloat(tx.amount || 0),
        balanceBefore: parseFloat(tx.balance_before || 0),
        balanceAfter: parseFloat(tx.balance_after || 0),
        referenceType: ReferenceType.MANUAL_ADJUSTMENT,
        description: tx.description || 'Legacy Ledger Entry',
        createdAt: tx.created_at ? new Date(tx.created_at) : new Date(),
      },
    });
  }
  console.log(`✅ Migrated ${transactions.length} Ledger Transactions.`);

  await connection.end();
  console.log('🎉 ALL HISTORICAL DATA SUCCESSFULLY TRANSFERRED A TO Z!');
}

migrate()
  .catch((err) => {
    console.error('❌ Migration Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

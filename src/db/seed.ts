import { getPool, closePool } from '../config/database';
import { calculateInventoryStatus, worstStatus } from '../utils/status';
import { hashPassword } from '../utils/password';
import type { StatusLevel } from '../types';

interface IdRow {
  id: number;
}

interface InventorySeed {
  centerIndex: number;
  supplyIndex: number;
  quantity: number;
  minThreshold: number;
}

async function seed(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `TRUNCATE alerts, redistribution_requests, inventory, supplies, centers, users
       RESTART IDENTITY CASCADE`,
    );

    const adminPassword = await hashPassword('Admin123!');
    const rescuerPassword = await hashPassword('Rescuer123!');

    const usersResult = await client.query<IdRow>(
      `INSERT INTO users (full_name, email, password, role) VALUES
         ('System Administrator', 'admin@pgrtc.org', $1, 'admin'),
         ('Field Rescuer', 'rescuer@pgrtc.org', $2, 'rescuer')
       RETURNING id`,
      [adminPassword, rescuerPassword],
    );
    const adminId = usersResult.rows[0]?.id;
    const rescuerId = usersResult.rows[1]?.id;
    if (!adminId || !rescuerId) {
      throw new Error('Failed to seed users');
    }

    const centersResult = await client.query<IdRow>(
      `INSERT INTO centers (center_name, type, latitude, longitude) VALUES
         ('Hospital Central de Madrid', 'hospital', 40.416775, -3.703790),
         ('Hospital General de Barcelona', 'hospital', 41.387398, 2.168890),
         ('Centro de Acopio Valencia', 'collection_center', 39.469907, -0.376288),
         ('Centro de Acopio Sevilla', 'collection_center', 37.389092, -5.984459)
       RETURNING id`,
    );
    const centerIds = centersResult.rows.map((row) => row.id);

    const suppliesResult = await client.query<IdRow>(
      `INSERT INTO supplies (supply_name, unit) VALUES
         ('blood_o_negative', 'units'),
         ('water', 'liters'),
         ('antibiotics', 'boxes'),
         ('bandages', 'packs'),
         ('oxygen_tanks', 'tanks')
       RETURNING id`,
    );
    const supplyIds = suppliesResult.rows.map((row) => row.id);

    const inventorySeed: InventorySeed[] = [
      { centerIndex: 0, supplyIndex: 0, quantity: 12, minThreshold: 10 },
      { centerIndex: 0, supplyIndex: 1, quantity: 120, minThreshold: 100 },
      { centerIndex: 0, supplyIndex: 2, quantity: 200, minThreshold: 50 },
      { centerIndex: 0, supplyIndex: 3, quantity: 80, minThreshold: 60 },
      { centerIndex: 1, supplyIndex: 0, quantity: 3, minThreshold: 8 },
      { centerIndex: 1, supplyIndex: 1, quantity: 300, minThreshold: 100 },
      { centerIndex: 1, supplyIndex: 4, quantity: 40, minThreshold: 20 },
      { centerIndex: 2, supplyIndex: 1, quantity: 200, minThreshold: 80 },
      { centerIndex: 2, supplyIndex: 2, quantity: 60, minThreshold: 25 },
      { centerIndex: 2, supplyIndex: 3, quantity: 200, minThreshold: 100 },
      { centerIndex: 3, supplyIndex: 2, quantity: 40, minThreshold: 30 },
      { centerIndex: 3, supplyIndex: 3, quantity: 500, minThreshold: 100 },
      { centerIndex: 3, supplyIndex: 4, quantity: 10, minThreshold: 10 },
    ];

    const statusesByCenter = new Map<number, StatusLevel[]>();

    for (const item of inventorySeed) {
      const centerId = centerIds[item.centerIndex];
      const supplyId = supplyIds[item.supplyIndex];
      if (centerId === undefined || supplyId === undefined) {
        throw new Error('Invalid inventory seed reference');
      }

      const status = calculateInventoryStatus(item.quantity, item.minThreshold);
      await client.query(
        `INSERT INTO inventory (center_id, supply_id, quantity, min_threshold, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [centerId, supplyId, item.quantity, item.minThreshold, status],
      );

      const current = statusesByCenter.get(centerId) ?? [];
      current.push(status);
      statusesByCenter.set(centerId, current);
    }

    for (const [centerId, statuses] of statusesByCenter) {
      await client.query('UPDATE centers SET status = $1 WHERE id = $2', [
        worstStatus(statuses),
        centerId,
      ]);
    }

    const sourceCenterId = centerIds[2];
    const targetCenterId = centerIds[1];
    const waterSupplyId = supplyIds[1];
    if (sourceCenterId === undefined || targetCenterId === undefined || waterSupplyId === undefined) {
      throw new Error('Invalid redistribution seed reference');
    }

    await client.query(
      `INSERT INTO redistribution_requests
         (source_center_id, target_center_id, supply_id, quantity, status, requested_by)
       VALUES ($1, $2, $3, $4, 'pending', $5)`,
      [sourceCenterId, targetCenterId, waterSupplyId, 50, rescuerId],
    );

    const bloodSupplyId = supplyIds[0];
    const barcelonaId = centerIds[1];
    if (bloodSupplyId === undefined || barcelonaId === undefined) {
      throw new Error('Invalid alert seed reference');
    }

    await client.query(
      `INSERT INTO alerts (center_id, supply_id, alert_level, message)
       VALUES ($1, $2, 'red', $3)`,
      [
        barcelonaId,
        bloodSupplyId,
        'Inventory of "blood_o_negative" at "Hospital General de Barcelona" is at red level',
      ],
    );

    await client.query('COMMIT');
    console.log('[seed] Database seeded successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

seed()
  .then(() => closePool())
  .then(() => process.exit(0))
  .catch(async (error: unknown) => {
    console.error('[seed] Failed to seed database:', error);
    await closePool().catch(() => undefined);
    process.exit(1);
  });

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initSchema } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initSchema();

  if (req.method === 'GET') {
    const sessions = await sql`
      SELECT s.*,
        COALESCE(
          json_agg(
            json_build_object(
              'memberId', sm.member_id,
              'buyIns', sm.buy_ins,
              'chipsLeft', sm.chips_left
            )
          ) FILTER (WHERE sm.member_id IS NOT NULL),
          '[]'
        ) AS members
      FROM sessions s
      LEFT JOIN session_members sm ON sm.session_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `;
    const mapped = sessions.map(s => ({
      id: s.id,
      date: s.date,
      buyInAmount: Number(s.buy_in_amount),
      chipRatio: Number(s.chip_ratio),
      isCustomRatio: s.is_custom_ratio,
      customCashAmount: s.custom_cash_amount ? Number(s.custom_cash_amount) : undefined,
      customChipAmount: s.custom_chip_amount ? Number(s.custom_chip_amount) : undefined,
      isActive: s.is_active,
      members: s.members,
    }));
    return res.status(200).json(mapped);
  }

  if (req.method === 'POST') {
    const { date, buyInAmount, chipRatio, isCustomRatio, customCashAmount, customChipAmount, members } = req.body;
    if (!date || !buyInAmount || !chipRatio) return res.status(400).json({ error: 'missing fields' });
    const id = `s${Date.now()}`;
    await sql`
      INSERT INTO sessions (id, date, buy_in_amount, chip_ratio, is_custom_ratio, custom_cash_amount, custom_chip_amount, is_active)
      VALUES (${id}, ${date}, ${buyInAmount}, ${chipRatio}, ${isCustomRatio ?? false}, ${customCashAmount ?? null}, ${customChipAmount ?? null}, TRUE)
    `;
    if (members && members.length > 0) {
      for (const m of members) {
        await sql`
          INSERT INTO session_members (session_id, member_id, buy_ins, chips_left)
          VALUES (${id}, ${m.memberId}, ${m.buyIns ?? 1}, NULL)
          ON CONFLICT (session_id, member_id) DO NOTHING
        `;
      }
    }
    return res.status(201).json({ id });
  }

  if (req.method === 'PATCH') {
    const { id, action, ...body } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });

    if (action === 'end') {
      const { memberChips } = body;
      await sql`UPDATE sessions SET is_active = FALSE WHERE id = ${id}`;
      for (const mc of memberChips) {
        await sql`UPDATE session_members SET chips_left = ${mc.chipsLeft} WHERE session_id = ${id} AND member_id = ${mc.memberId}`;
      }
      return res.status(200).json({ ok: true });
    }

    if (action === 'addBuyIn') {
      await sql`UPDATE session_members SET buy_ins = buy_ins + 1 WHERE session_id = ${id} AND member_id = ${body.memberId}`;
      return res.status(200).json({ ok: true });
    }

    if (action === 'removeBuyIn') {
      await sql`UPDATE session_members SET buy_ins = GREATEST(buy_ins - 1, 1) WHERE session_id = ${id} AND member_id = ${body.memberId}`;
      return res.status(200).json({ ok: true });
    }

    if (action === 'endMember') {
      await sql`UPDATE session_members SET chips_left = ${body.chipsLeft} WHERE session_id = ${id} AND member_id = ${body.memberId}`;
      return res.status(200).json({ ok: true });
    }

    if (action === 'resumeMember') {
      await sql`UPDATE session_members SET chips_left = NULL WHERE session_id = ${id} AND member_id = ${body.memberId}`;
      return res.status(200).json({ ok: true });
    }

    if (action === 'addMember') {
      await sql`
        INSERT INTO session_members (session_id, member_id, buy_ins, chips_left)
        VALUES (${id}, ${body.memberId}, 1, NULL)
        ON CONFLICT (session_id, member_id) DO NOTHING
      `;
      return res.status(200).json({ ok: true });
    }

    if (action === 'updateMembers') {
      for (const m of body.members) {
        await sql`UPDATE session_members SET buy_ins = ${m.buyIns}, chips_left = ${m.chipsLeft} WHERE session_id = ${id} AND member_id = ${m.memberId}`;
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'unknown action' });
  }

  return res.status(405).json({ error: 'method not allowed' });
}

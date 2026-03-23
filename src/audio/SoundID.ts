/**
 * Sound IDs — maps to file paths under /assets/menton/sounds/
 *
 * AS3 reference: MentonSyncSoundsSwf.as + SoundID.as
 */

const BASE = import.meta.env.BASE_URL + 'assets/menton/sounds/'

// ── Helpers ──────────────────────────────────────────────────────
const sfx = (file: string) => `${BASE}${file}.m4a`
const vo = (file: string) => `${BASE}en/male/${file}.m4a`

// ── Background Music ─────────────────────────────────────────────
export const BG_MENTON = sfx('menton_trilha_looping')
export const BG_BONUS = sfx('trilha_bonus')

// ── Ball Drawing ─────────────────────────────────────────────────
export const BALL_SHOT = sfx('bola_disparo')
export const BALL_HIT = sfx('bola_batendo_v2')
export const EXTRA_BALL_ACTIVATED = sfx('bola_extra_v2')
export const SUPER_BALL_ACTIVATED = sfx('bola_super_v2')

// ── Buttons / UI ─────────────────────────────────────────────────
export const BUTTON_CLICK = sfx('clique_botao')
export const BUTTON_SHUFFLE = sfx('trocar_cartela')
export const PEEL = sfx('botao_filar_v2')

// Stake buttons — indexed by stake value
export const BUTTON_STAKE: Record<number, string> = {
  1: sfx('aposta01'),
  2: sfx('aposta02'),
  3: sfx('aposta03'),
  4: sfx('aposta04'),
  5: sfx('aposta05'),
  10: sfx('aposta010'),
  25: sfx('aposta025'),
  50: sfx('aposta050'),
  100: sfx('aposta0100'),
}

// ── Prize SFX ────────────────────────────────────────────────────
export const PRIZE_LINE = sfx('linha_v2')
export const PRIZE_DOUBLE_LINE = sfx('linha_dupla_v2')
export const PRIZE_DOUBLE_COLUMNS = sfx('duas_colunas')
export const PRIZE_THREE_COLUMNS = sfx('tres_colunas_v2')
export const PRIZE_FOUR_COLUMNS = sfx('quatro_colunas_v2')
export const PRIZE_DOUBLE_BOX = sfx('caixa_dupla_v2')
export const PRIZE_BINGO = sfx('bingo')

// ── Coin Collection ──────────────────────────────────────────────
export const COINS_COLLECT = sfx('contagem_valor_v2')

// ── Bell / Slot ──────────────────────────────────────────────────
export const BELL = sfx('sino')
export const BELL_RINGING = sfx('sino_tocando')
export const SLOT_SPIN = sfx('slot_spin')
export const SLOT_STOP = sfx('slot_stop')
export const SLOT_PRIZE_2X = sfx('slot_prize_2x')
export const SLOT_PRIZE_BONUS = sfx('slot_prize_bonus')
export const SLOT_PRIZE_BOMB = sfx('slot_prize_bomb')

// ── Fruit Bomb ───────────────────────────────────────────────────
export const BOMB_FALL = sfx('bomba_caindo')
export const BOMB_EXPLODE = sfx('bomba_explodindo')

// ── Bonus Game (Fête du Citron) ──────────────────────────────────
export const BONUS_MACHINE_MOVING = sfx('esteira_movendo_v2')
export const BONUS_BOX_BREAKING = sfx('caixa_quebrando')
export const BONUS_LEMON_VUPT = sfx('limao_vupt')
export const BONUS_LEMON_STICKING_LOW = sfx('limao_grudando_pouco')
export const BONUS_LEMON_STICKING_MED = sfx('limao_grudando_medio')
export const BONUS_LEMON_STICKING_HIGH = sfx('limao_grudando_muitos')
export const BONUS_STATUE_MOVING = sfx('figura_andando')
export const BONUS_STATUE_COMPLETE = sfx('figura_completa_v3')
export const BONUS_TOURISTS = sfx('turistas')
export const BONUS_END_1 = sfx('conclusao_lvl_1_v2')
export const BONUS_END_2 = sfx('conclusao_lvl_2')
export const BONUS_END_3 = sfx('conclusao_lvl_3_v2')

// ── Voice-Overs (EN only — V1) ──────────────────────────────────
// Each prize has N variants; playVO picks one at random.

export const VO_BINGO = [vo('bingo_1'), vo('bingo_2'), vo('bingo_3')]
export const VO_JACKPOT = [vo('jackpot_1'), vo('jackpot_2'), vo('jackpot_3')]
export const VO_DOUBLE_LINE = [vo('linha_dupla_1'), vo('linha_dupla_2'), vo('linha_dupla_3'), vo('linha_dupla_4')]
export const VO_THREE_COLUMNS = [vo('tres_colunas_1'), vo('tres_colunas_2'), vo('tres_colunas_3')]
export const VO_FOUR_COLUMNS = [vo('quatro_colunas_1'), vo('quatro_colunas_2'), vo('quatro_colunas_3')]
export const VO_DOUBLE_BOX = [vo('caixa_dupla_1'), vo('caixa_dupla_2'), vo('caixa_dupla_3')]

// ── All URLs (for preloading) ────────────────────────────────────
export const ALL_SOUND_URLS: string[] = [
  BG_MENTON, BG_BONUS,
  BALL_SHOT, BALL_HIT, EXTRA_BALL_ACTIVATED, SUPER_BALL_ACTIVATED,
  BUTTON_CLICK, BUTTON_SHUFFLE, PEEL,
  ...Object.values(BUTTON_STAKE),
  PRIZE_LINE, PRIZE_DOUBLE_LINE, PRIZE_DOUBLE_COLUMNS,
  PRIZE_THREE_COLUMNS, PRIZE_FOUR_COLUMNS, PRIZE_DOUBLE_BOX, PRIZE_BINGO,
  COINS_COLLECT,
  BELL, BELL_RINGING, SLOT_SPIN, SLOT_STOP,
  SLOT_PRIZE_2X, SLOT_PRIZE_BONUS, SLOT_PRIZE_BOMB,
  BOMB_FALL, BOMB_EXPLODE,
  BONUS_MACHINE_MOVING, BONUS_BOX_BREAKING, BONUS_LEMON_VUPT,
  BONUS_LEMON_STICKING_LOW, BONUS_LEMON_STICKING_MED, BONUS_LEMON_STICKING_HIGH,
  BONUS_STATUE_MOVING, BONUS_STATUE_COMPLETE, BONUS_TOURISTS,
  BONUS_END_1, BONUS_END_2, BONUS_END_3,
  ...VO_BINGO, ...VO_JACKPOT, ...VO_DOUBLE_LINE,
  ...VO_THREE_COLUMNS, ...VO_FOUR_COLUMNS, ...VO_DOUBLE_BOX,
]

/** Menton layout positions — AS3 Menton.as addComp() coordinates */

// AS3: addComp(CardPanel, {x: 70, y: 255})
export const CARD_PANEL_X = 70
export const CARD_PANEL_Y = 255

// AS3: addComp(BellPanel, {x: 555, y: 75})
export const BELL_PANEL_X = 555
export const BELL_PANEL_Y = 75

// AS3: addComp(BallPanelMenton, {x: 0, y: 220})
export const BALL_PANEL_X = 0
export const BALL_PANEL_Y = 220

// BellPanel visible area: clipRect(-5, 0, 200, 150)
export const BELL_PANEL_W = 200
export const BELL_PANEL_H = 150

// BellPanel center in Menton space
export const BELL_PANEL_CENTER_X = BELL_PANEL_X + BELL_PANEL_W / 2
export const BELL_PANEL_CENTER_Y = BELL_PANEL_Y + BELL_PANEL_H / 2

// AS3: Payout — local x:525, y:10 inside ButtonPanel (x:7, y:712)
// Absolute in Menton space: 7+525=532, 712+10=722
export const PAYOUT_X = 532
export const PAYOUT_Y = 722
export const PAYOUT_W = 202
export const PAYOUT_H = 93
export const PAYOUT_CENTER_X = PAYOUT_X + PAYOUT_W / 2
export const PAYOUT_CENTER_Y = PAYOUT_Y + PAYOUT_H / 2

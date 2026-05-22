const express = require('express');
const router = express.Router();
function match(input = {}) {
  const pairs = input.pairs || [
    { a: 'Mika', b: 'Jon', belt_gap: 1, weight_gap_lb: 18, injury_flag: false },
    { a: 'Ana', b: 'Lee', belt_gap: 3, weight_gap_lb: 42, injury_flag: true },
  ];
  return { pairs: pairs.map(p => {
    const risk = Number(p.belt_gap) * 15 + Number(p.weight_gap_lb) * 0.8 + (p.injury_flag ? 35 : 0);
    return { ...p, safety_score: Math.round(100 - Math.min(100, risk)), action: risk >= 60 ? 'do_not_pair' : risk >= 35 ? 'instructor_supervised' : 'safe_pair' };
  }) };
}
router.get('/', (req, res) => res.json(match()));
router.post('/match', (req, res) => res.json(match(req.body || {})));
module.exports = router;

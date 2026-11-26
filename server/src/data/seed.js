export const vendors = [
  { code: 'pragmatic', name: 'Pragmatic Play' },
  { code: 'evolution', name: 'Evolution' },
  { code: 'playngo', name: "Play'n GO" },
  { code: 'netent', name: 'NetEnt' },
  { code: 'hacksaw', name: 'Hacksaw Gaming' },
];

const titles = {
  pragmatic: [
    'Sweet Bonanza',
    'Gates of Olympus',
    'The Dog House',
    'Big Bass Bonanza',
    'Wolf Gold',
    'Starlight Princess',
  ],

  evolution: ['Lightning Roulette', 'Crazy Time', 'Speed Blackjack', 'Monopoly Live', 'Dream Catcher'],

  playngo: ['Book of Dead', 'Reactoonz', 'Rise of Olympus', 'Fire Joker', 'Legacy of Dead'],

  netent: ['Starburst', "Gonzo's Quest", 'Dead or Alive', 'Twin Spin', 'Divine Fortune'],

  hacksaw: ['Wanted Dead or a Wild', 'Chaos Crew', 'Le Bandit'],
};

const types = {
  pragmatic: 'SLOT',
  evolution: 'LIVE',
  playngo: 'SLOT',
  netent: 'SLOT',
  hacksaw: 'SLOT',
};

export function buildSeedGames() {
  let id = 0;

  return Object.entries(titles).flatMap(([vendorCode, list]) =>
    list.map((title, index) => {
      id += 1;

      return {
        id,
        vendorCode,
        gameCode: `${vendorCode}-${index + 1}`,
        title,
        titleJp: null,
        type: types[vendorCode],
        active: index % 4 !== 3,
        sort: 100 - index,
        createdAt: new Date(Date.UTC(2026, 0, id)).toISOString(),
      };
    })
  );
}

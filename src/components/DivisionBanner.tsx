const teams = [
  { id: 'steelers', city: 'Pittsburgh', name: 'Steelers', letters: 'PIT', motto: 'Forged in steel.' },
  { id: 'ravens', city: 'Baltimore', name: 'Ravens', letters: 'BAL', motto: 'Nevermore.' },
  { id: 'bengals', city: 'Cincinnati', name: 'Bengals', letters: 'CIN', motto: 'Who Dey.' },
  { id: 'browns', city: 'Cleveland', name: 'Browns', letters: 'CLE', motto: 'Dawg country.' },
]

export default function DivisionBanner() {
  return (
    <div className="division-banner" aria-label="The four teams of the AFC North">
      {teams.map(team => (
        <div className={`team-panel team-${team.id}`} key={team.id}>
          <span className="team-city">{team.city}</span>
          <span className="team-monogram" aria-hidden="true">{team.letters}</span>
          <div className="team-caption"><strong>{team.name}</strong><span>{team.motto}</span></div>
        </div>
      ))}
    </div>
  )
}

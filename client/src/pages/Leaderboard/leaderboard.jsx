import "./Leaderboard.css";

const leaderboardData = [
  { rank: 1, name: "Kameron", current: 20, longest: 20 },
  { rank: 2, name: "Fidel", current: 14, longest: 18 },
  { rank: 3, name: "Adella", current: 8, longest: 12 },
  { rank: 4, name: "Shawn", current: 7, longest: 7 },
  { rank: 5, name: "Clair", current: 4, longest: 5 },
];

export default function Leaderboard() {
  return (
    <div className="leaderboard-container">
      <div className="leaderboard">
        <div className="leaderboard-header">
          🎸 TOP 5 Leaderboard 🎸
        </div>

        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Current Streak</th>
              <th>Longest Streak</th>
            </tr>
          </thead>

          <tbody>
            {leaderboardData.map((player) => (
              <tr key={player.rank}>
                <td className="rank">{player.rank}</td>
                <td>{player.name}</td>
                <td>{player.current}</td>
                <td>{player.longest}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
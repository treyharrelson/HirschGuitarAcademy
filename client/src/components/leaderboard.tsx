import "./leaderboard.css";

type Player = {
  rank: number;
  name: string;
  current: number;
  longest: number;
};

const leaderboardData: Player[] = [
  { rank: 1, name: "Kameron", current: 20, longest: 48 },
  { rank: 2, name: "Fidel", current: 14, longest: 27 },
  { rank: 3, name: "Adella", current: 8, longest: 22 },
  { rank: 4, name: "Shawn", current: 7, longest: 13 },
  { rank: 5, name: "Clair", current: 4, longest: 7 },
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
              <th>Login Streak</th>
              <th>Lessons Completed</th>
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
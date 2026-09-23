import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Search, Crosshair, Trophy, Activity, Swords, Target, Flame, AlertCircle, ChevronDown, ChevronUp, X } from "lucide-react";

import { stripDiacritics } from "@/lib/normalize";
import { Reveal } from "@/components/site/Reveal";
import { AgentImage } from "@/components/site/AgentImage";
import { getMMRByName, getMatchesByName, type MatchCardData } from "@/lib/valorant-api";
import { getRankIcon } from "@/lib/ranks";
import { playerConfig } from "@/config/player";

export const Route = createFileRoute("/tracker")({
  head: () => ({
    meta: [
      { title: "Byte - Game" },
      { name: "description", content: "Public Valorant player tracker — look up any player's rank, stats, and match history." },
      { property: "og:title", content: "Byte - Game" },
    ],
  }),
  component: TrackerPage,
});

interface MMRResponse {
  status: number;
  data: {
    account: { name: string; tag: string };
    current: {
      tier: { id: number; name: string };
      rr: number;
      last_change: number;
      elo: number;
    };
    peak: {
      tier: { id: number; name: string };
      rr: number;
      season: { id: string; short: string };
    } | null;
    seasonal: Array<{
      season: { id: string; short: string };
      wins: number;
      games: number;
      end_tier: { id: number; name: string };
      end_rr: number;
    }>;
  };
}

interface MatchResponse {
  status: number;
  data: Array<{
    metadata: {
      match_id: string;
      map: { id: string; name: string };
      started_at: string;
      game_length_in_ms: number;
      queue: { id: string; name: string | null };
    };
    players: Array<{
      puuid: string;
      name: string;
      tag: string;
      agent: { id: string; name: string };
      stats: {
        score: number;
        kills: number;
        deaths: number;
        assists: number;
        headshots: number;
        bodyshots: number;
        legshots: number;
        damage?: { dealt: number; received: number };
      };
      team_id: string;
    }>;
    teams: Array<{
      team_id: string;
      won: boolean;
      rounds: { won: number; lost: number };
    }>;
  }>;
}

function RankBadge({ tierName }: { tierName: string }) {
  const icon = getRankIcon(tierName);
  return (
    <img src={icon} alt="rank" width={28} height={28} className="shrink-0" />
  );
}

function PlayerStat({ kills, deaths, assists, damage }: { kills: number; deaths: number; assists: number; damage?: { dealt: number; received: number } }) {
  const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
  return (
    <div className="text-center">
      <div className="text-display text-sm font-bold">{kills} / {deaths} / {assists}</div>
      <div className="text-[0.65rem] text-muted-foreground">{kd} K/D</div>
    </div>
  );
}

interface MatchDetailProps {
  match: MatchResponse["data"][0];
  playerName: string;
  playerTag: string;
  onClose: () => void;
}

function MatchDetail({ match, playerName, playerTag, onClose }: MatchDetailProps) {
  const player = match.players.find(
    (p) => stripDiacritics(p.name).toLowerCase() === stripDiacritics(playerName).toLowerCase() && stripDiacritics(p.tag).toLowerCase() === stripDiacritics(playerTag).toLowerCase()
  );
  if (!player) return null;

  const teammates = [...match.players.filter((p) => p.team_id === player.team_id)]
    .sort((a, b) => b.stats.score - a.stats.score);
  const opponents = [...match.players.filter((p) => p.team_id !== player.team_id)]
    .sort((a, b) => b.stats.score - a.stats.score);
  const team = match.teams.find((t) => t.team_id === player.team_id);
  const won = team?.won ?? false;

  const duration = Math.round(match.metadata.game_length_in_ms / 60000);
  const date = new Date(match.metadata.started_at);
  const dateStr = `${date.getDate()} ${date.toLocaleString("en", { month: "short" })}`;

  return (
    <div className="panel grain mt-2 overflow-hidden border-l-2 animate-in slide-in-from-top-2 duration-200" style={{ borderLeftColor: won ? "#22c55e" : "#ef4444" }}>
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold ${won ? "text-green-400" : "text-red-400"}`}>{won ? "VICTORY" : "DEFEAT"}</span>
          <span className="text-sm text-muted-foreground">{match.metadata.map.name}</span>
          <span className="text-xs text-muted-foreground">{match.metadata.queue.name ?? "Ranked"}</span>
          <span className="text-xs text-muted-foreground">{duration}m</span>
          <span className="text-xs text-muted-foreground">{dateStr}</span>
        </div>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-1 gap-2 px-3 pb-3 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="label-hud text-xs">{team?.team_id ?? "Team"}</span>
            <span className={`text-xs ${won ? "text-green-400" : "text-red-400"}`}>{team?.rounds.won ?? 0} - {team?.rounds.lost ?? 0}</span>
          </div>
          <div className="space-y-1">
            {teammates.map((p, idx) => (
              <div key={p.puuid} className={`flex items-center gap-2 rounded px-2 py-1.5 ${p.name === playerName ? "bg-primary/10" : "bg-background/50"}`}>
                {idx === 0 && <span className="text-[0.6rem] font-bold text-yellow-400">MVP</span>}
                <AgentImage name={p.agent.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-xs font-bold ${p.name === playerName ? "text-primary" : "text-foreground"}`}>
                    {p.name} <span className="text-muted-foreground">#{p.tag}</span>
                    {p.name === playerName && <span className="ml-1 text-[0.6rem] text-primary">YOU</span>}
                  </div>
                  <div className="text-[0.65rem] text-muted-foreground">{p.agent.name}</div>
                </div>
                <PlayerStat kills={p.stats.kills} deaths={p.stats.deaths} assists={p.stats.assists} {...(p.stats.damage ? { damage: p.stats.damage } : {})} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 label-hud text-xs">Opponent</div>
          <div className="space-y-1">
            {opponents.map((p, idx) => (
              <div key={p.puuid} className="flex items-center gap-2 rounded px-2 py-1.5 bg-background/50">
                {idx === 0 && <span className="text-[0.6rem] font-bold text-orange-400">MVP</span>}
                <AgentImage name={p.agent.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-foreground">{p.name} <span className="text-muted-foreground">#{p.tag}</span></div>
                  <div className="text-[0.65rem] text-muted-foreground">{p.agent.name}</div>
                </div>
                <PlayerStat kills={p.stats.kills} deaths={p.stats.deaths} assists={p.stats.assists} {...(p.stats.damage ? { damage: p.stats.damage } : {})} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const REGIONS = [
  { value: "ap", label: "Asia Pacific" },
  { value: "eu", label: "Europe" },
  { value: "na", label: "North America" },
  { value: "sa", label: "South America" },
  { value: "sea", label: "Southeast Asia" },
] as const;

function TrackerPage() {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [region, setRegion] = useState("ap");

  const [searched, setSearched] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchTag, setSearchTag] = useState("");

  const [mmr, setMmr] = useState<MMRResponse | null>(null);
  const [matches, setMatches] = useState<MatchResponse["data"]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  const handleSearch = useCallback(() => {
    const n = name.trim();
    const t = tag.trim();
    if (!n || !t) return;
    setSearched(true);
    setSearchName(n);
    setSearchTag(t);
    setLoading(true);
    setError(null);
    setNotFound(false);
    setMmr(null);
    setMatches([]);
    setExpandedMatch(null);

    (async () => {
      try {
        const [mmrRes, matchRes] = await Promise.all([
          getMMRByName(n, t, region, "pc"),
          getMatchesByName(n, t, region, "pc", 12),
        ]);

        const mmrOk = mmrRes.status === 200;
        const matchOk = matchRes.status === 200;

        if (!mmrOk && !matchOk) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (mmrOk && mmrRes.data) setMmr(mmrRes);
        if (matchOk) {
          setMatches(matchRes.data ?? []);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [name, tag, region]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  }, [handleSearch]);

  const playerMatches = matches.map((m) => {
    const player = m.players.find((p) => stripDiacritics(p.name).toLowerCase() === stripDiacritics(searchName).toLowerCase() && stripDiacritics(p.tag).toLowerCase() === stripDiacritics(searchTag).toLowerCase());
    if (!player) return null;
    const team = m.teams.find((t) => t.team_id === player.team_id);
    return { ...m, player, won: team?.won ?? false };
  }).filter(Boolean) as Array<{
    metadata: MatchResponse["data"][0]["metadata"];
    players: MatchResponse["data"][0]["players"];
    player: MatchResponse["data"][0]["players"][0];
    won: boolean;
    teams: MatchResponse["data"][0]["teams"];
  }>;

  const totalGames = playerMatches.length;
  const wins = playerMatches.filter((m) => m.won).length;
  const losses = totalGames - wins;
  const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : "0";

  const totalKills = playerMatches.reduce((s, m) => s + m.player.stats.kills, 0);
  const totalDeaths = playerMatches.reduce((s, m) => s + m.player.stats.deaths, 0);
  const totalAssists = playerMatches.reduce((s, m) => s + m.player.stats.assists, 0);
  const totalHS = playerMatches.reduce((s, m) => {
    const t = m.player.stats.headshots + m.player.stats.bodyshots + m.player.stats.legshots;
    return s + (t > 0 ? m.player.stats.headshots / t : 0);
  }, 0);
  const totalScore = playerMatches.reduce((s, m) => s + m.player.stats.score, 0);

  const kd = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2);
  const hsPercent = totalGames > 0 ? ((totalHS / totalGames) * 100).toFixed(1) : "0";
  const avgACS = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
  const avgDamage = totalGames > 0 ? Math.round(totalKills / totalGames) : 0;

  const agentMap = new Map<string, { name: string; games: number; wins: number; kills: number; deaths: number; assists: number }>();
  for (const m of playerMatches) {
    const a = m.player.agent.name;
    const existing = agentMap.get(a) ?? { name: a, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
    existing.games++;
    if (m.won) existing.wins++;
    existing.kills += m.player.stats.kills;
    existing.deaths += m.player.stats.deaths;
    existing.assists += m.player.stats.assists;
    agentMap.set(a, existing);
  }
  const agentStats = [...agentMap.values()].sort((a, b) => b.games - a.games);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
      <Reveal>
        <div className="mb-8 text-center">
          <span className="label-hud text-primary">Player Tracker</span>
          <h1 className="text-display mt-3 text-4xl font-extrabold sm:text-5xl">Look Up Any Player</h1>
          <p className="mx-auto mt-2 max-w-lg text-xs text-muted-foreground">
            Enter a Riot ID to check rank, match history, agent performance, and season history.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="mx-auto mb-10 flex max-w-2xl flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Riot Name"
            className="clip-tag flex-1 border border-border bg-background/60 px-4 py-3 text-sm font-medium tracking-wider text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
          />
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tag"
            maxLength={5}
            className="clip-tag w-full border border-border bg-background/60 px-4 py-3 text-center text-sm font-bold tracking-wider text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60 sm:w-24"
          />
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="clip-tag w-full cursor-pointer border border-border bg-background/60 px-4 py-3 text-sm font-medium tracking-wider text-foreground outline-none transition-colors focus:border-primary/60 sm:w-40"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || !name.trim() || !tag.trim()}
            className="clip-tag flex items-center justify-center gap-2 border border-primary/70 bg-primary/10 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-glow disabled:opacity-40"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </Reveal>

      {error && (
        <Reveal>
          <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">{error}</span>
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="shrink-0 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary-foreground transition-colors"
            >
              Retry
            </button>
          </div>
        </Reveal>
      )}

      {notFound && (
        <Reveal>
          <div className="mb-6 flex flex-col items-center gap-3 rounded-lg border border-border bg-background/50 px-4 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Player not found. Check the Riot ID and region.</p>
          </div>
        </Reveal>
      )}

      {loading && (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Looking up {name} #{tag}...</p>
          </div>
        </div>
      )}

      {!loading && !error && !notFound && searched && mmr && (
        <>
          <Reveal>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              {mmr.data.current && (
                <Reveal delay={0.08}>
                  <div className="mt-3 flex items-center gap-3">
                    <RankBadge tierName={mmr.data.current.tier.name} />
                    <div>
                      <span className="label-hud text-primary">Current Rank</span>
                      <div className="text-sm font-bold">{mmr.data.current.tier.name}</div>
                      <div className="text-xs text-muted-foreground">{mmr.data.current.rr} RR</div>
                    </div>
                  </div>
                </Reveal>
              )}
              {mmr.data.peak && (
                <Reveal delay={0.08}>
                  <div className="mt-3 flex items-center gap-3">
                    <RankBadge tierName={mmr.data.peak.tier.name} />
                    <div>
                      <span className="label-hud text-muted-foreground">Peak Rank</span>
                      <div className="text-sm font-bold">{mmr.data.peak.tier.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {mmr.data.peak.rr} RR — Season {mmr.data.peak.season.short}
                      </div>
                    </div>
                  </div>
                </Reveal>
              )}
              <div className="sm:ml-auto">
                <span className="label-hud text-primary">Tracker</span>
                <h2 className="text-display text-2xl font-bold">{mmr.data.account.name} #{mmr.data.account.tag}</h2>
              </div>
            </div>
          </Reveal>

          <section className="mb-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Reveal delay={0.06}>
                <StatCard icon={Trophy} label="Win Rate" value={`${winRate}%`} color={Number(winRate) >= 50 ? "text-green-400" : "text-red-400"} />
              </Reveal>
              <Reveal delay={0.1}>
                <StatCard icon={Target} label="K/D" value={kd} />
              </Reveal>
              <Reveal delay={0.14}>
                <StatCard icon={Crosshair} label="Headshot %" value={`${hsPercent}%`} />
              </Reveal>
              <Reveal delay={0.18}>
                <StatCard icon={Activity} label="Avg ACS" value={String(avgACS)} />
              </Reveal>
              <Reveal delay={0.22}>
                <StatCard icon={Flame} label="Avg Kills" value={String(avgDamage)} />
              </Reveal>
              <Reveal delay={0.26}>
                <StatCard icon={Swords} label="Matches" value={`${wins}W ${losses}L`} />
              </Reveal>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
            <section>
              <h2 className="label-hud mb-4 text-primary">Recent Matches</h2>
              <div className="space-y-2">
                {playerMatches.map((m, i) => {
                  const p = m.player;
                  const isExpanded = expandedMatch === m.metadata.match_id;
                  const gameKd = p.stats.deaths > 0 ? (p.stats.kills / p.stats.deaths).toFixed(2) : p.stats.kills.toFixed(2);

                  return (
                    <div key={m.metadata.match_id}>
                      <Reveal delay={i * 0.04}>
                        <div
                          className={`panel grain flex cursor-pointer flex-col gap-3 p-4 transition-all hover:border-primary/30 sm:flex-row sm:items-center sm:gap-4 ${m.won ? "border-l-2 border-l-green-500" : "border-l-2 border-l-red-500"}`}
                          onClick={() => setExpandedMatch(isExpanded ? null : m.metadata.match_id)}
                        >
                          <div className="flex items-center gap-3 sm:w-28">
                            <div className={`flex h-8 w-8 items-center justify-center rounded text-xs font-bold ${m.won ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                              {m.won ? "W" : "L"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {m.teams.find((t) => t.team_id === p.team_id)?.rounds.won ?? 0} - {m.teams.find((t) => t.team_id === p.team_id)?.rounds.lost ?? 0}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:w-40">
                            <AgentImage name={p.agent.name} size="sm" />
                            <div className="text-sm font-bold">{p.agent.name}</div>
                            <div className="text-xs text-muted-foreground">{m.metadata.map.name}</div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="font-bold">{p.stats.kills}</span>
                              <span className="text-muted-foreground">/</span>
                              <span className="text-red-400">{p.stats.deaths}</span>
                              <span className="text-muted-foreground">/</span>
                              <span className="text-muted-foreground">{p.stats.assists}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">{gameKd} K/D</div>
                          </div>
                          <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
                            <span>{p.stats.score} ACS</span>
                            <span>{m.metadata.queue.name ?? "Ranked"}</span>
                            <span>{Math.round(m.metadata.game_length_in_ms / 60000)}m</span>
                            <span>{new Date(m.metadata.started_at).getDate()} {new Date(m.metadata.started_at).toLocaleString("en", { month: "short" })}</span>
                          </div>
                          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            <span className="hidden sm:inline">{isExpanded ? "Hide" : "Details"}</span>
                          </div>
                        </div>
                      </Reveal>
                      {isExpanded && (
                        <MatchDetail
                          match={m}
                          playerName={searchName}
                          playerTag={searchTag}
                          onClose={() => setExpandedMatch(null)}
                        />
                      )}
                    </div>
                  );
                })}

                {playerMatches.length === 0 && (
                  <div className="panel grain flex h-32 items-center justify-center">
                    <p className="text-sm text-muted-foreground">No matches found</p>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="label-hud mb-4 text-primary">Agent Performance</h2>
              <div className="space-y-2">
                {agentStats.map((a, i) => {
                  const agentKd = a.deaths > 0 ? (a.kills / a.deaths).toFixed(2) : a.kills.toFixed(2);
                  const agentWR = a.games > 0 ? ((a.wins / a.games) * 100).toFixed(0) : "0";
                  return (
                    <Reveal key={a.name} delay={i * 0.05}>
                      <div className="panel grain p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <AgentImage name={a.name} size="sm" />
                            <div>
                              <div className="text-display text-sm font-bold">{a.name}</div>
                              <div className="text-xs text-muted-foreground">{a.games} games</div>
                            </div>
                          </div>
                          <div className="text-right text-xs">
                            <div className="font-bold">{agentKd} K/D</div>
                            <div className={Number(agentWR) >= 50 ? "text-green-400" : "text-red-400"}>{agentWR}% WR</div>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>

              {mmr.data.seasonal && mmr.data.seasonal.length > 0 && (
                <>
                  <h2 className="label-hud mb-4 mt-8 text-primary">Season History</h2>
                  <div className="space-y-2">
                    {mmr.data.seasonal.slice(0, 4).map((s, i) => (
                      <Reveal key={s.season.id} delay={i * 0.05}>
                        <div className="panel grain p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-display text-sm font-bold">{s.season.short}</div>
                              <div className="text-xs text-muted-foreground">{s.wins}W / {s.games} games</div>
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-bold">{s.end_tier.name}</div>
                              <div className="text-xs text-muted-foreground">{s.end_rr} RR</div>
                            </div>
                          </div>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        </>
      )}

      {!loading && !error && !notFound && searched && !mmr && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-background/50 px-4 py-12 text-center">
          <Crosshair className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No data found for this player.</p>
        </div>
      )}

      {!searched && !loading && (
        <Reveal>
          <div className="mx-auto mt-4 max-w-md text-center">
            <p className="text-xs text-muted-foreground">
              Try searching for any Valorant player by their Riot ID.
            </p>
          </div>
        </Reveal>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = "text-foreground" }: { icon: React.ElementType; label: string; value: string; color?: string }) {
  return (
    <div className="panel grain p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="label-hud">{label}</span>
      </div>
      <div className={`text-display mt-1 text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

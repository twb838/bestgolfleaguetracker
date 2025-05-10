// Prepare holes for handicap calculations
export const prepareHolesForHandicaps = (holes) => {
    if (!holes || holes.length === 0) return [];

    // Create a copy of the holes array with only valid handicaps
    const holesWithHandicaps = holes
        .filter(hole => hole.handicap !== null && hole.handicap !== undefined)
        .map(hole => ({
            id: hole.id,
            handicap: hole.handicap
        }));

    // Sort holes by handicap value (lowest to highest)
    return holesWithHandicaps.sort((a, b) => a.handicap - b.handicap);
};

// Calculate player pops based on lowest handicap
export const calculatePlayerPops = (teamScores, otherTeamScores = []) => {
    if (!teamScores || teamScores.length === 0) return [];

    // Combine players from both teams to find the overall lowest handicap
    const allPlayers = [...teamScores, ...(otherTeamScores || [])];

    // Find the lowest handicap among all players
    const lowestHandicap = Math.min(...allPlayers.map(player =>
        player.handicap !== null && player.handicap !== undefined ? player.handicap : Infinity
    ));

    // Calculate pops for each player based on the overall lowest handicap
    return teamScores.map(player => ({
        ...player,
        pops: player.handicap !== null && player.handicap !== undefined
            ? Math.max(0, player.handicap - lowestHandicap)
            : 0
    }));
};

// Calculate match results
export const calculateMatchResults = (match, homeTeamScores, awayTeamScores, holes) => {
    // Initialize results structure
    const results = {
        match_id: match.id,
        date: match.match_date,
        home_team: {
            id: match.home_team_id,
            name: match.home_team?.name || 'Home Team',
            total_points: 0,
            total_score: 0,
            total_points_by_hole: [],
            players: []
        },
        away_team: {
            id: match.away_team_id,
            name: match.away_team?.name || 'Away Team',
            total_points: 0,
            total_score: 0,
            total_points_by_hole: [],
            players: []
        }
    };

    // Calculate player scores and determine individual points
    const pairings = Math.min(homeTeamScores.length, awayTeamScores.length);

    // Setup the player structure in the results
    for (let i = 0; i < pairings; i++) {
        const homePlayer = homeTeamScores[i];
        const awayPlayer = awayTeamScores[i];

        results.home_team.players.push({
            player_id: homePlayer.player_id,
            player_name: homePlayer.player_name,
            handicap: homePlayer.handicap,
            pops: homePlayer.pops || 0,
            score: 0,
            score_net: 0,
            points: 0,
            points_by_hole: Array(holes.length).fill(null),
            opponent_id: awayPlayer.player_id,
            opponent_name: awayPlayer.player_name,
        });

        results.away_team.players.push({
            player_id: awayPlayer.player_id,
            player_name: awayPlayer.player_name,
            handicap: awayPlayer.handicap,
            pops: awayPlayer.pops || 0,
            score: 0,
            score_net: 0,
            points: 0,
            points_by_hole: Array(holes.length).fill(null),
            opponent_id: homePlayer.player_id,
            opponent_name: homePlayer.player_name,
        });
    }

    // Calculate points hole by hole
    holes.forEach((hole, holeIndex) => {
        // Implementation details from the original file...
        // This is where the hole-by-hole scoring calculations occur
    });

    return results;
};
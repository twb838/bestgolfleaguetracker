import { prepareHolesForHandicaps } from './calculateScores';

// Calculate net score for a player on a hole
export const calculateNetScore = (score, pops, hole, holes) => {
    if (score === '' || score === undefined) return '';

    // If the player has no pops or hole has no handicap, the net score is the same as gross
    if (!pops || !hole.handicap === undefined || hole.handicap === null) return Number(score);

    // Get the total number of holes in the course
    const totalHoles = holes.length;

    // For a course with fewer than 18 holes, we need to adjust how pops are distributed
    // Calculate how many "complete rounds" of pops to give across all holes
    const fullRounds = Math.floor(pops / totalHoles);

    // Calculate remaining pops to distribute based on hole handicap
    const remainingPops = pops % totalHoles;

    // All holes get the full rounds of strokes
    let strokesGiven = fullRounds;

    // Find this hole's position in the sorted handicap list
    const sortedHoles = prepareHolesForHandicaps(holes);
    const holePosition = sortedHoles.findIndex(h => h.id === hole.id);

    // If hole is one of the hardest holes (based on remaining pops), give an extra stroke
    if (holePosition !== -1 && holePosition < remainingPops) {
        strokesGiven += 1;
    }

    // Return net score
    return Number(score) - strokesGiven;
};

// Calculate team net total
export const calculateTeamNetTotal = (players) => {
    return players.reduce((total, player) => {
        return total + (player.score_net || 0);
    }, 0);
};

// Get next input field for auto-tabbing
export const getNextInputField = (teamType, currentPlayerIndex, currentHoleId, teamScores, holes) => {
    // Find the current hole's index in the holes array
    const currentHoleIndex = holes.findIndex(h => h.id === currentHoleId);

    // If this is the last hole for the current player
    if (currentHoleIndex === holes.length - 1) {
        // Move to the next player's first hole
        if (currentPlayerIndex < teamScores.length - 1) {
            return document.querySelector(
                `[data-player-index="${currentPlayerIndex + 1}"][data-team-type="${teamType}"][data-hole-index="0"] input`
            );
        }
        // If we're at the last player's last hole, don't auto-tab
        return null;
    }

    // Otherwise, move to the next hole for the current player
    return document.querySelector(
        `[data-player-index="${currentPlayerIndex}"][data-team-type="${teamType}"][data-hole-index="${currentHoleIndex + 1}"] input`
    );
};
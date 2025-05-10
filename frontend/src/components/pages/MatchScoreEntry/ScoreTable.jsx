import React from 'react';
import {
    Box, Paper, Typography, TextField, IconButton,
    Grid, Chip
} from '@mui/material';
import { PersonAdd as SubstituteIcon } from '@mui/icons-material';
import { calculateNetScore } from './utils/scoreHelpers';

const ScoreTable = ({
    teamScores,
    otherTeamScores,
    teamType,
    course,
    holes,
    match,
    editMode,
    handleScoreChange,
    handleOpenSubstituteDialog
}) => {
    // Function to calculate player total
    const calculatePlayerTotal = (playerScores) => {
        return holes.reduce((total, hole) => {
            const score = playerScores.scores[hole.id];
            return total + (score ? score : 0);
        }, 0);
    };

    // Function to calculate course par
    const calculatePar = () => {
        return holes.reduce((total, hole) => total + hole.par, 0);
    };

    // Helper function to find the next input field to focus
    const getNextInputField = (teamType, currentPlayerIndex, currentHoleId) => {
        // Find the current hole's index in the holes array
        const currentHoleIndex = holes.findIndex(h => h.id === currentHoleId);

        // If this is the last hole for the current player
        if (currentHoleIndex === holes.length - 1) {
            // Move to the next player's first hole
            if (currentPlayerIndex < teamScores.length - 1) {
                // Next player in same team
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

    // Determine which property to use for hole number and par
    const holeNumberProp = holes[0] && 'hole_number' in holes[0] ? 'hole_number' : 'number';

    return (
        <Box>
            {/* Player names in horizontal list at top */}
            <Paper sx={{ mb: 1, p: 0.5, bgcolor: 'background.paper' }}>
                <Grid container spacing={0.5} alignItems="center">
                    <Grid item xs={3} sx={{ fontWeight: 'bold', pl: 1 }}>
                        Hole
                    </Grid>
                    {teamScores.map((player, index) => (
                        <Grid item xs key={player.player_id} sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 'bold',
                                        fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                    }}
                                >
                                    {player.player_name.split(' ')[0]}
                                    {player.is_substitute &&
                                        <Chip
                                            size="small"
                                            label="Sub"
                                            color="secondary"
                                            sx={{ ml: 0.5, height: 16, fontSize: '0.6rem' }}
                                        />
                                    }
                                </Typography>

                                {player.handicap !== undefined && player.handicap !== null && (
                                    <Box component="span" sx={{
                                        display: 'block',
                                        fontSize: '0.65rem',
                                        color: 'text.secondary'
                                    }}>
                                        Hdcp: {player.handicap}
                                        {player.pops > 0 && ` (Pops: ${player.pops})`}
                                    </Box>
                                )}

                                {/* Add substitute button */}
                                {(!match.is_completed || editMode) && (
                                    <IconButton
                                        size="small"
                                        onClick={() => handleOpenSubstituteDialog(teamType, index)}
                                        sx={{ padding: '2px', mt: 0.5 }}
                                    >
                                        <SubstituteIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                                    </IconButton>
                                )}
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            {/* Holes as rows with player scores as columns */}
            {holes.map((hole) => (
                <HoleRow
                    key={hole.id}
                    hole={hole}
                    teamScores={teamScores}
                    otherTeamScores={otherTeamScores}
                    teamType={teamType}
                    holes={holes}
                    match={match}
                    editMode={editMode}
                    handleScoreChange={handleScoreChange}
                    getNextInputField={getNextInputField}
                />
            ))}

            {/* Totals row */}
            <Paper sx={{ mt: 1, p: 0.5, bgcolor: 'grey.100', fontWeight: 'bold' }}>
                <Grid container spacing={0.5} alignItems="center">
                    <Grid item xs={3} sx={{ pl: 1 }}>
                        <Typography variant="caption">Total</Typography>
                    </Grid>
                    {teamScores.map((player) => {
                        const total = calculatePlayerTotal(player);
                        const par = calculatePar();
                        const diff = total - par;
                        return (
                            <Grid item xs key={player.player_id} sx={{ textAlign: 'center' }}>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 'bold',
                                            color: diff < 0 ? 'success.main' :
                                                diff === 0 ? 'text.primary' : 'error.main'
                                        }}
                                    >
                                        {total || '-'}
                                    </Typography>
                                    {total > 0 && (
                                        <Typography variant="caption" sx={{
                                            fontSize: '0.65rem',
                                            color: diff < 0 ? 'success.main' :
                                                diff === 0 ? 'text.secondary' : 'error.main'
                                        }}>
                                            {diff < 0 ? diff : diff > 0 ? `+${diff}` : 'E'}
                                        </Typography>
                                    )}

                                    {/* Net total - based on handicap, not pops */}
                                    {total > 0 && player.handicap > 0 && (
                                        <Typography variant="caption" sx={{
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            color: 'primary.main',
                                            mt: 0.5
                                        }}>
                                            Net: {total - player.handicap}
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            </Paper>
        </Box>
    );
};

// Extract hole row as a separate component
const HoleRow = ({
    hole,
    teamScores,
    otherTeamScores,
    teamType,
    holes,
    match,
    editMode,
    handleScoreChange,
    getNextInputField
}) => {
    return (
        <Paper
            key={hole.id}
            sx={{
                mb: 0.5,
                p: 0.5,
                height: '120px',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper'
            }}
        >
            <Grid container spacing={0.5} alignItems="flex-start" sx={{ flex: 1 }}>
                {/* Hole info */}
                <Grid item xs={3}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                                sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 0.5,
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem'
                                }}
                            >
                                {hole.number || hole.hole_number}
                            </Box>
                            <Typography variant="caption">
                                Par {hole.par} • {hole.yards || '—'} yds
                            </Typography>
                        </Box>
                        {hole.handicap !== undefined && hole.handicap !== null && (
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 0.5 }}>
                                Hdcp: {hole.handicap || '—'}
                            </Typography>
                        )}
                    </Box>
                </Grid>

                {/* Player score inputs */}
                {teamScores.map((player, playerIndex) => {
                    const score = player.scores[hole.id] || '';

                    // Determine if this is the low NET score across ALL players for this hole
                    let isLowScore = false;
                    if (score !== '') {
                        // Calculate the net score for this player
                        const netScore = calculateNetScore(score, player.pops, hole);

                        // Get all net scores for this hole from both teams
                        const allNetScoresForHole = [];

                        // Get net scores for each team
                        teamScores.forEach(p => {
                            const holeScore = p.scores[hole.id];
                            if (holeScore !== undefined && holeScore !== '') {
                                allNetScoresForHole.push(calculateNetScore(holeScore, p.pops, hole));
                            }
                        });

                        otherTeamScores.forEach(p => {
                            const holeScore = p.scores[hole.id];
                            if (holeScore !== undefined && holeScore !== '') {
                                allNetScoresForHole.push(calculateNetScore(holeScore, p.pops, hole));
                            }
                        });

                        // Only highlight if this is the absolute lowest net score
                        // and there is more than one score to compare
                        isLowScore = allNetScoresForHole.length > 1 &&
                            netScore === Math.min(...allNetScoresForHole) &&
                            allNetScoresForHole.filter(s => s === netScore).length === 1; // No ties
                    }

                    return (
                        <Grid item xs key={`${player.player_id}-${hole.id}`} sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <TextField
                                    type="number"
                                    variant="outlined"
                                    value={score}
                                    disabled={match.is_completed && !editMode}
                                    onChange={(e) => handleScoreChange(
                                        teamType,
                                        playerIndex,
                                        hole.id,
                                        e.target.value
                                    )}
                                    onKeyUp={(e) => {
                                        // Auto-tab to next input on Enter or Tab key
                                        if (e.key === 'Enter' || e.key === 'Tab') {
                                            const nextInput = getNextInputField(teamType, playerIndex, hole.id);
                                            if (nextInput) {
                                                // Only prevent default if we have a next input to focus
                                                e.preventDefault();
                                                nextInput.focus();
                                            }
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Tab') {
                                            const nextInput = getNextInputField(teamType, playerIndex, hole.id);
                                            if (nextInput) {
                                                e.preventDefault();
                                                nextInput.focus();
                                            }
                                        }
                                    }}
                                    inputProps={{
                                        inputMode: 'numeric',
                                        pattern: '[0-9]*',
                                        maxLength: 2,
                                        style: {
                                            textAlign: 'center',
                                            fontWeight: score !== '' ? 'bold' : 'normal',
                                            padding: '2px'
                                        }
                                    }}
                                    sx={{
                                        width: '45px',
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: score !== ''
                                                ? (isLowScore ? 'rgba(76, 175, 80, 0.2)' : 'white')
                                                : undefined,
                                            border: isLowScore ? '2px solid #4caf50' : undefined,
                                        },
                                        '& input': {
                                            p: 0.5,
                                            color: 'text.primary'
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderWidth: '1px'
                                        }
                                    }}
                                    size="small"
                                    data-player-index={playerIndex}
                                    data-team-type={teamType}
                                    data-hole-id={hole.id}
                                    data-hole-index={holes.findIndex(h => h.id === hole.id)}
                                />

                                {/* Net score display - only show if different from gross */}
                                {score !== '' && player.pops > 0 && (
                                    (() => {
                                        const netScore = calculateNetScore(score, player.pops, hole);
                                        // Only show net score if it's different from gross score
                                        return Number(score) !== netScore ? (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontSize: '0.65rem',
                                                    color: 'text.secondary',
                                                    mt: 0.5,
                                                    display: 'block',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                Net: {netScore}
                                            </Typography>
                                        ) : null;
                                    })()
                                )}
                            </Box>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Team totals for this hole */}
            <TeamHoleTotals
                teamScores={teamScores}
                otherTeamScores={otherTeamScores}
                hole={hole}
                teamType={teamType}
            />
        </Paper>
    );
};

// Extract team hole totals as a separate component
const TeamHoleTotals = ({ teamScores, otherTeamScores, hole, teamType }) => {
    return (
        <Grid container spacing={0.5} alignItems="center"
            sx={{
                mt: 'auto',
                pt: 0.5,
                borderTop: '1px dashed rgba(0,0,0,0.1)'
            }}
        >
            <Grid item xs={3}>
                <Typography variant="caption" sx={{ pl: 0.5, fontSize: '0.65rem' }}>Team Total</Typography>
            </Grid>
            <Grid item xs={9} sx={{ textAlign: 'center' }}>
                {(() => {
                    // Calculate team NET total for this hole
                    let teamGrossTotal = 0;
                    let teamNetTotal = 0;
                    let completedScores = 0;

                    teamScores.forEach(player => {
                        const score = player.scores[hole.id];
                        if (score !== undefined && score !== '') {
                            // Add gross score to gross total
                            teamGrossTotal += Number(score);

                            // Calculate and add net score to net total
                            const netScore = calculateNetScore(score, player.pops, hole);
                            teamNetTotal += netScore;

                            completedScores++;
                        }
                    });

                    const hasCompleteScores = completedScores === teamScores.length;

                    // Check if this is the low team NET total
                    let isLowTeamTotal = false;
                    if (hasCompleteScores) {
                        let otherTeamNetTotal = 0;
                        let otherTeamComplete = true;

                        otherTeamScores.forEach(player => {
                            const score = player.scores[hole.id];
                            if (score !== undefined && score !== '') {
                                // Calculate and add net score
                                const netScore = calculateNetScore(score, player.pops, hole);
                                otherTeamNetTotal += netScore;
                            } else {
                                otherTeamComplete = false;
                            }
                        });

                        isLowTeamTotal = otherTeamComplete && teamNetTotal < otherTeamNetTotal;
                    }

                    return (
                        <Box
                            sx={{
                                display: 'inline-block',
                                minWidth: '2rem',
                                fontWeight: 'bold',
                                color: isLowTeamTotal ? 'white' : 'text.secondary',
                                backgroundColor: isLowTeamTotal ? 'primary.main' : 'transparent',
                                borderRadius: '4px',
                                padding: '1px 6px',
                                border: isLowTeamTotal ? '1px solid #1976d2' : 'none'
                            }}
                        >
                            {hasCompleteScores ? (
                                <>
                                    {teamGrossTotal}
                                    {teamGrossTotal !== teamNetTotal && (
                                        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem' }}>
                                            Net: {teamNetTotal}
                                        </Typography>
                                    )}
                                </>
                            ) : '-'}
                        </Box>
                    );
                })()}
            </Grid>
        </Grid>
    );
};

export default ScoreTable;
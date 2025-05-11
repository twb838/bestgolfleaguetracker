import React from 'react';
import {
    Box, Paper, Typography, TextField, Grid, IconButton, Chip, Alert
} from '@mui/material';
import { PersonAdd as SubstituteIcon } from '@mui/icons-material';

const MatchScorecard = ({
    match,
    homeTeamScores,
    awayTeamScores,
    holes,
    editMode,
    handleScoreChange,
    handleOpenSubstituteDialog,
    calculateNetScore,
    calculatePlayerTotal,
    calculatePar
}) => {
    // Function to render the score table for a team
    const renderScoreTable = (teamScores, teamType) => {
        if (!holes || !holes.length) {
            return (
                <Alert severity="warning" sx={{ my: 1 }}>
                    Course information is not available.
                </Alert>
            );
        }

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
                                    {!match.is_completed || editMode ? (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleOpenSubstituteDialog(teamType, index)}
                                            sx={{ padding: '2px', mt: 0.5 }}
                                        >
                                            <SubstituteIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                                        </IconButton>
                                    ) : null}
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>

                {/* Holes as rows with player scores as columns */}
                {holes.map((hole) => (
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

                                    // Get home team net scores for this hole
                                    homeTeamScores.forEach(p => {
                                        const holeScore = p.scores[hole.id];
                                        if (holeScore !== undefined && holeScore !== '') {
                                            allNetScoresForHole.push(calculateNetScore(holeScore, p.pops, hole));
                                        }
                                    });

                                    // Get away team net scores for this hole
                                    awayTeamScores.forEach(p => {
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

                        {/* Team totals */}
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
                                            teamGrossTotal += Number(score);
                                            const netScore = calculateNetScore(score, player.pops, hole);
                                            teamNetTotal += netScore;
                                            completedScores++;
                                        }
                                    });

                                    const hasCompleteScores = completedScores === teamScores.length;

                                    // Check if this is the low team NET total
                                    let isLowTeamTotal = false;
                                    if (hasCompleteScores) {
                                        const otherTeamScores = teamType === 'home' ? awayTeamScores : homeTeamScores;
                                        let otherTeamNetTotal = 0;
                                        let otherTeamComplete = true;

                                        otherTeamScores.forEach(player => {
                                            const score = player.scores[hole.id];
                                            if (score !== undefined && score !== '') {
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
                    </Paper>
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

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ mb: 1 }}>
                <Typography variant="h6" gutterBottom>
                    Match Scorecard
                </Typography>

                <Grid container spacing={1}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 1, mb: 1, bgcolor: 'rgba(33, 150, 243, 0.05)' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {match.home_team?.name || 'Home'} Team
                            </Typography>
                            <Box>
                                {homeTeamScores.length > 0 ? (
                                    renderScoreTable(homeTeamScores, 'home')
                                ) : (
                                    <Alert severity="info" sx={{ mt: 1 }}>
                                        No players found for home team.
                                    </Alert>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 1, mb: 1, bgcolor: 'rgba(244, 67, 54, 0.05)' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {match.away_team?.name || 'Away'} Team
                            </Typography>
                            <Box>
                                {awayTeamScores.length > 0 ? (
                                    renderScoreTable(awayTeamScores, 'away')
                                ) : (
                                    <Alert severity="info" sx={{ mt: 1 }}>
                                        No players found for away team.
                                    </Alert>
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    );
};

export default MatchScorecard;
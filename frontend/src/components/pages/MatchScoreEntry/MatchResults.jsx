import React from 'react';
import {
    Box, Paper, Typography, Button, Grid, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

const MatchResults = ({ results, calculateMatchResults }) => {
    if (!results) return null;

    // Helper function to calculate team net total
    const calculateTeamNetTotal = (players) => {
        return players.reduce((sum, player) => {
            const playerNetScore = player.score - (player.handicap || 0);
            return sum + playerNetScore;
        }, 0);
    };

    return (
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Match Results</Typography>

                {/* Add Recalculate button */}
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => calculateMatchResults()}
                    startIcon={<RefreshIcon />}
                    sx={{ fontSize: '0.8rem' }}
                >
                    Recalculate
                </Button>
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {results.home_team.name}
                    </Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                        {results.home_team.total_points}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Team Total: {results.home_team.total_score}
                        {results.home_team.team_point ? ' (+1 point)' : ''}
                    </Typography>
                    {/* Add net team total display */}
                    <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'medium' }}>
                        Net Total: {calculateTeamNetTotal(results.home_team.players)}
                    </Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {results.away_team.name}
                    </Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                        {results.away_team.total_points}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Team Total: {results.away_team.total_score}
                        {results.away_team.team_point ? ' (+1 point)' : ''}
                    </Typography>
                    {/* Add net team total display */}
                    <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'medium' }}>
                        Net Total: {calculateTeamNetTotal(results.away_team.players)}
                    </Typography>
                </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Individual Results
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                            <TableCell
                                sx={{
                                    fontWeight: 'bold',
                                    borderRight: '1px solid rgba(224, 224, 224, 1)',
                                    bgcolor: 'rgba(33, 150, 243, 0.1)'
                                }}
                            >
                                Home Player
                            </TableCell>
                            <TableCell
                                align="center"
                                sx={{
                                    fontWeight: 'bold',
                                    borderRight: '1px solid rgba(224, 224, 224, 1)',
                                    bgcolor: 'rgba(33, 150, 243, 0.1)'
                                }}
                            >
                                Score
                            </TableCell>
                            <TableCell
                                align="center"
                                sx={{
                                    fontWeight: 'bold',
                                    borderRight: '2px solid rgba(0, 0, 0, 0.2)', // Stronger border here
                                    bgcolor: 'rgba(33, 150, 243, 0.1)'
                                }}
                            >
                                Points
                            </TableCell>
                            <TableCell
                                align="center"
                                sx={{
                                    fontWeight: 'bold',
                                    bgcolor: 'rgba(244, 67, 54, 0.1)'
                                }}
                            >
                                Points
                            </TableCell>
                            <TableCell
                                align="center"
                                sx={{
                                    fontWeight: 'bold',
                                    bgcolor: 'rgba(244, 67, 54, 0.1)'
                                }}
                            >
                                Score
                            </TableCell>
                            <TableCell
                                sx={{
                                    fontWeight: 'bold',
                                    bgcolor: 'rgba(244, 67, 54, 0.1)'
                                }}
                            >
                                Away Player
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {results.home_team.players.map((homePlayer, index) => {
                            const awayPlayer = results.away_team.players[index];

                            return (
                                <TableRow key={`pairing-${index}`}>
                                    <TableCell>
                                        {homePlayer.player_name}
                                        {homePlayer.handicap !== undefined && homePlayer.handicap !== null && (
                                            <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                                Handicap: {homePlayer.handicap}
                                                {homePlayer.pops > 0 && ` (Pops: ${homePlayer.pops})`}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        {homePlayer.score || '-'}
                                        {homePlayer.handicap > 0 && homePlayer.score > 0 && (
                                            <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                                Net: {homePlayer.score - homePlayer.handicap}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center" sx={{
                                        fontWeight: 'bold',
                                        color: homePlayer.points > 0 ? 'success.main' : 'text.secondary'
                                    }}>
                                        {homePlayer.points}
                                    </TableCell>
                                    <TableCell align="center" sx={{
                                        fontWeight: 'bold',
                                        color: awayPlayer.points > 0 ? 'success.main' : 'text.secondary'
                                    }}>
                                        {awayPlayer.points}
                                    </TableCell>
                                    <TableCell align="center">
                                        {awayPlayer.score || '-'}
                                        {awayPlayer.handicap > 0 && awayPlayer.score > 0 && (
                                            <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                                Net: {awayPlayer.score - awayPlayer.handicap}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {awayPlayer.player_name}
                                        {awayPlayer.handicap !== undefined && awayPlayer.handicap !== null && (
                                            <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                                Handicap: {awayPlayer.handicap}
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Team Total</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                {results.home_team.total_score}
                                <Typography variant="caption" display="block" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                                    Net: {calculateTeamNetTotal(results.home_team.players)}
                                </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{
                                fontWeight: 'bold',
                                color: results.home_team.total_points_by_hole.filter(p => p === 1).length > 0 ? 'success.main' : 'text.secondary'
                            }}>
                                {results.home_team.total_points_by_hole.filter(p => p === 1).length}
                            </TableCell>
                            <TableCell align="center" sx={{
                                fontWeight: 'bold',
                                color: results.away_team.total_points_by_hole.filter(p => p === 1).length > 0 ? 'success.main' : 'text.secondary'
                            }}>
                                {results.away_team.total_points_by_hole.filter(p => p === 1).length}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                {results.away_team.total_score}
                                <Typography variant="caption" display="block" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                                    Net: {calculateTeamNetTotal(results.away_team.players)}
                                </Typography>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Team Total</TableCell>
                        </TableRow>
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Total Points</TableCell>
                            <TableCell align="center" sx={{
                                fontWeight: 'bold',
                                color: 'primary.main',
                                fontSize: '1.1rem'
                            }}>
                                {results.home_team.total_points}
                            </TableCell>
                            <TableCell align="center" sx={{
                                fontWeight: 'bold',
                                color: 'primary.main',
                                fontSize: '1.1rem'
                            }}>
                                {results.away_team.total_points}
                            </TableCell>
                            <TableCell colSpan={2} sx={{ textAlign: 'right', fontWeight: 'bold' }}>Total Points</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Scoring System
                </Typography>
                <Typography variant="body2">
                    • 1 point awarded for each player with the lowest individual net score (no points for ties)
                </Typography>
                <Typography variant="body2">
                    • 1 additional point awarded to the team with the lowest combined net total (no points for ties)
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    • Player pops are calculated by subtracting the lowest handicap in the group from each player's handicap
                </Typography>
                <Typography variant="body2">
                    • Net scores apply pops across holes based on hole handicap (lower hole handicap = higher difficulty)
                </Typography>
            </Box>
        </Paper>
    );
};

export default MatchResults;
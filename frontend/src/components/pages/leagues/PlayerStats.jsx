import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Typography,
    Box,
    Paper,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import {
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    Dangerous as DangerousIcon
} from '@mui/icons-material';
import { get } from '../../../services/api';

const PlayerStats = ({ league }) => {
    const { leagueId } = useParams();

    // Player stats state
    const [playerStats, setPlayerStats] = useState([]);
    const [loadingPlayerStats, setLoadingPlayerStats] = useState(false);
    const [playerStatsSortConfig, setPlayerStatsSortConfig] = useState({
        key: 'avg_gross_score',
        direction: 'asc'
    });

    useEffect(() => {
        if (league?.id) {
            fetchPlayerStats();
        }
    }, [league?.id]);

    const fetchPlayerStats = async () => {
        if (!league?.id) return;

        setLoadingPlayerStats(true);
        try {
            const data = await get(`/player-stats/league/${leagueId}/player-stats?minimum_rounds=1`);
            setPlayerStats(data);
        } catch (error) {
            console.error('Error fetching player stats:', error);
            setPlayerStats([]);
        } finally {
            setLoadingPlayerStats(false);
        }
    };

    const handlePlayerStatsSort = (key) => {
        let direction = 'asc';
        if (playerStatsSortConfig.key === key && playerStatsSortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setPlayerStatsSortConfig({ key, direction });
    };

    const getSortedPlayerStats = () => {
        if (!playerStats || playerStats.length === 0) return [];

        const sortableData = [...playerStats];

        sortableData.sort((a, b) => {
            // Handle null values
            if (a[playerStatsSortConfig.key] === null && b[playerStatsSortConfig.key] === null) return 0;
            if (a[playerStatsSortConfig.key] === null) return 1;
            if (b[playerStatsSortConfig.key] === null) return -1;

            // String sorting for name
            if (playerStatsSortConfig.key === 'player_name') {
                return playerStatsSortConfig.direction === 'asc'
                    ? a.player_name.localeCompare(b.player_name)
                    : b.player_name.localeCompare(a.player_name);
            }

            // Number sorting for everything else
            return playerStatsSortConfig.direction === 'asc'
                ? a[playerStatsSortConfig.key] - b[playerStatsSortConfig.key]
                : b[playerStatsSortConfig.key] - a[playerStatsSortConfig.key];
        });

        return sortableData;
    };

    const getPlayerStatsSortArrow = (key) => {
        if (playerStatsSortConfig.key !== key) return null;
        return playerStatsSortConfig.direction === 'asc'
            ? <ArrowUpwardIcon fontSize="small" sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} />
            : <ArrowDownwardIcon fontSize="small" sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} />;
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Player Statistics
            </Typography>
            {loadingPlayerStats ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : playerStats && playerStats.length > 0 ? (
                <Box>
                    <TableContainer component={Paper} sx={{ mt: 2, overflow: 'auto' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                    <TableCell
                                        sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                        onClick={() => handlePlayerStatsSort('player_name')}
                                    >
                                        Player {getPlayerStatsSortArrow('player_name')}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                        onClick={() => handlePlayerStatsSort('rounds_played')}
                                    >
                                        Rounds {getPlayerStatsSortArrow('rounds_played')}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                        onClick={() => handlePlayerStatsSort('avg_gross_score')}
                                    >
                                        Avg Score {getPlayerStatsSortArrow('avg_gross_score')}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                        onClick={() => handlePlayerStatsSort('lowest_gross_score')}
                                    >
                                        Best Score {getPlayerStatsSortArrow('lowest_gross_score')}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                        onClick={() => handlePlayerStatsSort('avg_net_score')}
                                    >
                                        Avg Net {getPlayerStatsSortArrow('avg_net_score')}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                        onClick={() => handlePlayerStatsSort('lowest_net_score')}
                                    >
                                        Low Net {getPlayerStatsSortArrow('lowest_net_score')}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {getSortedPlayerStats().map((player) => (
                                    <TableRow
                                        key={player.player_id}
                                        sx={{
                                            '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                            '&:hover': { bgcolor: 'action.selected' }
                                        }}
                                    >
                                        <TableCell sx={{ fontWeight: 'bold', padding: '6px 8px' }}>
                                            {player.player_name}
                                        </TableCell>
                                        <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                            {player.rounds_played}
                                        </TableCell>
                                        <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                            {player.avg_gross_score ? player.avg_gross_score.toFixed(1) : '—'}
                                        </TableCell>
                                        <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                            {player.lowest_gross_score || '—'}
                                        </TableCell>
                                        <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                            {player.avg_net_score ? player.avg_net_score.toFixed(1) : '—'}
                                        </TableCell>
                                        <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                            {player.lowest_net_score ? player.lowest_net_score.toFixed(1) : '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <DangerousIcon color="action" sx={{ fontSize: 40, opacity: 0.5, mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                        No player statistics available yet.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Stats will appear once players have completed rounds.
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default PlayerStats;
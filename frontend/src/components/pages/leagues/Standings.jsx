import React, { useState, useEffect, useCallback } from 'react';
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
    TableRow,
    LinearProgress
} from '@mui/material';
import {
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { get } from '../../../services/api';

const Standings = ({ league }) => {
    const { leagueId } = useParams();

    // State for leaderboard data
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loadingAllMatches, setLoadingAllMatches] = useState(false);

    // Add these state variables with your other state declarations
    const [sortConfig, setSortConfig] = useState({
        key: 'win_percentage',
        direction: 'desc'
    });

    // Update fetchLeagueLeaderboard to use API service and useCallback
    const fetchLeagueLeaderboard = useCallback(async () => {
        if (!league?.id) return;

        setLoadingAllMatches(true);
        try {
            const data = await get(`/leagues/${leagueId}/leaderboard`);
            setLeaderboardData(data);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            setLeaderboardData([]);
        } finally {
            setLoadingAllMatches(false);
        }
    }, [league?.id, leagueId]);

    useEffect(() => {
        if (league?.id) {
            setLeaderboardData([]); // Clear previous data
            fetchLeagueLeaderboard();
        }
    }, [league?.id, fetchLeagueLeaderboard]);

    // Add this sort function
    const handleSort = (key) => {
        // Toggle direction if clicking the same column
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }

        setSortConfig({ key, direction });
    };

    // Create a sorted version of the leaderboard data
    const getSortedData = () => {
        if (!leaderboardData || leaderboardData.length === 0) return [];

        const sortableData = [...leaderboardData];

        sortableData.sort((a, b) => {
            // Special case for team name (string sorting)
            if (sortConfig.key === 'name') {
                return sortConfig.direction === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            }

            // Special case for rank (we maintain ranks based on win percentage)
            if (sortConfig.key === 'rank') {
                // When sorting by rank, we actually sort by win percentage
                return sortConfig.direction === 'asc'
                    ? a.win_percentage - b.win_percentage
                    : b.win_percentage - a.win_percentage;
            }

            // Handle null values for lowest scores
            if (sortConfig.key === 'lowest_gross' || sortConfig.key === 'lowest_net') {
                // If both values are null, they're equal
                if (a[sortConfig.key] === null && b[sortConfig.key] === null) return 0;
                // Null values should appear last regardless of sort direction
                if (a[sortConfig.key] === null) return 1;
                if (b[sortConfig.key] === null) return -1;
            }

            // Default numeric sorting
            return sortConfig.direction === 'asc'
                ? a[sortConfig.key] - b[sortConfig.key]
                : b[sortConfig.key] - a[sortConfig.key];
        });

        return sortableData;
    };

    // Add arrow indicator component to show sort direction
    const getSortArrow = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc'
            ? <ArrowUpwardIcon fontSize="small" sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} />
            : <ArrowDownwardIcon fontSize="small" sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} />;
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                League Standings
            </Typography>
            {loadingAllMatches ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : leaderboardData && leaderboardData.length > 0 ? (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                <TableCell
                                    sx={{ color: 'white', fontWeight: 'bold', width: '50px', padding: '6px 8px', cursor: 'pointer' }}
                                    onClick={() => handleSort('rank')}
                                >
                                    Rank {getSortArrow('rank')}
                                </TableCell>
                                <TableCell
                                    sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                    onClick={() => handleSort('name')}
                                >
                                    Team {getSortArrow('name')}
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                    onClick={() => handleSort('matches_played')}
                                >
                                    Matches {getSortArrow('matches_played')}
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                    onClick={() => handleSort('points_won')}
                                >
                                    Points Won {getSortArrow('points_won')}
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                    onClick={() => handleSort('points_lost')}
                                >
                                    Points Lost {getSortArrow('points_lost')}
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                    onClick={() => handleSort('win_percentage')}
                                >
                                    Win % {getSortArrow('win_percentage')}
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                    onClick={() => handleSort('lowest_gross')}
                                >
                                    Low Gross {getSortArrow('lowest_gross')}
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', cursor: 'pointer' }}
                                    onClick={() => handleSort('lowest_net')}
                                >
                                    Low Net {getSortArrow('lowest_net')}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {getSortedData().map((teamStats, index) => (
                                <TableRow
                                    key={teamStats.id}
                                    sx={{
                                        '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                        '&:hover': { bgcolor: 'action.selected' }
                                    }}
                                >
                                    <TableCell sx={{ fontWeight: 'bold', padding: '6px 8px' }}>
                                        {/* If sorted by something other than rank/win_percentage, show original rank */}
                                        {sortConfig.key === 'rank' || sortConfig.key === 'win_percentage'
                                            ? index + 1
                                            : leaderboardData.findIndex(team => team.id === teamStats.id) + 1}
                                    </TableCell>
                                    <TableCell
                                        component="th"
                                        scope="row"
                                        sx={{ fontWeight: 'bold', padding: '6px 8px' }}
                                    >
                                        {teamStats.name}
                                    </TableCell>
                                    <TableCell align="center" sx={{ padding: '6px 8px' }}>{teamStats.matches_played}</TableCell>
                                    <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                        {Number.isInteger(teamStats.points_won)
                                            ? teamStats.points_won
                                            : Math.round(teamStats.points_won)}
                                    </TableCell>
                                    <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                        {Number.isInteger(teamStats.points_lost)
                                            ? teamStats.points_lost
                                            : Math.round(teamStats.points_lost)}
                                    </TableCell>
                                    <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                        {teamStats.win_percentage}%
                                        {teamStats.matches_played > 0 &&
                                            <LinearProgress
                                                variant="determinate"
                                                value={teamStats.win_percentage}
                                                sx={{ mt: 0.5, height: 5, borderRadius: 2 }}
                                                color={teamStats.win_percentage > 50 ? "success" : "primary"}
                                            />
                                        }
                                    </TableCell>
                                    <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                        {teamStats.lowest_gross || '—'}
                                    </TableCell>
                                    <TableCell align="center" sx={{ padding: '6px 8px' }}>
                                        {teamStats.lowest_net || '—'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Typography variant="body2" color="text.secondary">
                    No leaderboard data available.
                </Typography>
            )}
        </Box>
    );
};

export default Standings;
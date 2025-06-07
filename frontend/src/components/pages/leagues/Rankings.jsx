import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    Typography,
    Box,
    Paper,
    CircularProgress,
    Grid,
    List,
    ListItem,
    Chip
} from '@mui/material';
import {
    EmojiEventsOutlined as TrophyOutlineIcon,
    Leaderboard as LeaderboardIcon,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { get } from '../../../services/api';

const Rankings = ({ league }) => {
    const { leagueId } = useParams();

    // State for rankings data
    const [rankingsData, setRankingsData] = useState({
        topIndividualGross: [],
        topIndividualNet: [],
        topTeamGross: [],
        topTeamNet: [],
        mostImproved: []
    });
    const [loadingRankings, setLoadingRankings] = useState(false);

    // Update fetchRankingsData to include most improved players
    const fetchRankingsData = useCallback(async () => {
        if (!league?.id) return;

        setLoadingRankings(true);
        try {
            const [
                individualGrossData,
                individualNetData,
                teamGrossData,
                teamNetData,
                mostImprovedData
            ] = await Promise.all([
                get(`/player-stats/league/${leagueId}/top-scores?limit=5&score_type=gross`).catch(() => []),
                get(`/player-stats/league/${leagueId}/top-scores?limit=5&score_type=net`).catch(() => []),
                get(`/team-stats/league/${leagueId}/top-scores?limit=5&score_type=gross`).catch(() => []),
                get(`/team-stats/league/${leagueId}/top-scores?limit=5&score_type=net`).catch(() => []),
                get(`/player-stats/league/${leagueId}/most-improved?limit=5`).catch(() => [])
            ]);

            setRankingsData({
                topIndividualGross: individualGrossData,
                topIndividualNet: individualNetData,
                topTeamGross: teamGrossData,
                topTeamNet: teamNetData,
                mostImproved: mostImprovedData
            });
        } catch (error) {
            setRankingsData({
                topIndividualGross: [],
                topIndividualNet: [],
                topTeamGross: [],
                topTeamNet: [],
                mostImproved: []
            });
        } finally {
            setLoadingRankings(false);
        }
    }, [league?.id, leagueId]);

    useEffect(() => {
        if (league?.id) {
            fetchRankingsData();
        }
    }, [league?.id, fetchRankingsData]);

    // Date formatting utility
    const formatDate = (dateString, formatPattern) => {
        if (!dateString) return '';

        try {
            const parsedDate = parseISO(dateString);
            return format(parsedDate, formatPattern);
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };

    // Helper function to format handicap improvement
    const formatHandicapImprovement = (improvement) => {
        if (improvement === null || improvement === undefined) return 'N/A';
        if (improvement > 0) {
            return `+${improvement.toFixed(1)}`;
        } else if (improvement < 0) {
            return improvement.toFixed(1);
        }
        return '0.0';
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Top Rankings
            </Typography>
            {loadingRankings ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {/* Individual Gross Scores */}
                    <Grid item xs={12} md={6}>
                        <Paper
                            sx={{
                                p: 2,
                                height: '100%',
                                border: '1px solid',
                                borderColor: 'divider',
                                overflow: 'hidden'
                            }}
                        >
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                pb: 1,
                                borderBottom: '1px solid',
                                borderColor: 'divider'
                            }}>
                                <TrophyOutlineIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" component="h3">
                                    Lowest Individual Gross Scores
                                </Typography>
                            </Box>

                            {rankingsData.topIndividualGross.length > 0 ? (
                                <List disablePadding>
                                    {rankingsData.topIndividualGross.map((score, index) => (
                                        <ListItem
                                            key={`gross-${score.player_id}-${index}`}
                                            sx={{
                                                px: 1,
                                                py: 0.5,
                                                backgroundColor: index % 2 === 0 ? 'action.hover' : 'transparent'
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    width: '100%'
                                                }}
                                            >
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        minWidth: '24px',
                                                        color: index === 0 ? 'warning.dark' : 'text.primary'
                                                    }}
                                                >
                                                    {index + 1}.
                                                </Typography>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                        {score.player_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {score.date ? formatDate(score.date, 'MMM d, yyyy') : 'Unknown date'} - {score.course_name || 'Unknown course'}
                                                    </Typography>
                                                </Box>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: 'success.main',
                                                        fontSize: index === 0 ? '1.2rem' : '1rem'
                                                    }}
                                                >
                                                    {score.score}
                                                </Typography>
                                            </Box>
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                    No individual gross scores recorded yet
                                </Typography>
                            )}
                        </Paper>
                    </Grid>

                    {/* Individual Net Scores */}
                    <Grid item xs={12} md={6}>
                        <Paper
                            sx={{
                                p: 2,
                                height: '100%',
                                border: '1px solid',
                                borderColor: 'divider',
                                overflow: 'hidden'
                            }}
                        >
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                pb: 1,
                                borderBottom: '1px solid',
                                borderColor: 'divider'
                            }}>
                                <TrophyOutlineIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" component="h3">
                                    Lowest Individual Net Scores
                                </Typography>
                            </Box>

                            {rankingsData.topIndividualNet.length > 0 ? (
                                <List disablePadding>
                                    {rankingsData.topIndividualNet.map((score, index) => (
                                        <ListItem
                                            key={`net-${score.player_id}-${index}`}
                                            sx={{
                                                px: 1,
                                                py: 0.5,
                                                backgroundColor: index % 2 === 0 ? 'action.hover' : 'transparent'
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    width: '100%'
                                                }}
                                            >
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        minWidth: '24px',
                                                        color: index === 0 ? 'warning.dark' : 'text.primary'
                                                    }}
                                                >
                                                    {index + 1}.
                                                </Typography>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                        {score.player_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {score.date ? formatDate(score.date, 'MMM d, yyyy') : 'Unknown date'} - {score.course_name || 'Unknown course'}
                                                    </Typography>
                                                </Box>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: 'success.main',
                                                        fontSize: index === 0 ? '1.2rem' : '1rem'
                                                    }}
                                                >
                                                    {score.score}
                                                </Typography>
                                            </Box>
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                    No individual net scores recorded yet
                                </Typography>
                            )}
                        </Paper>
                    </Grid>

                    {/* Team Gross Scores */}
                    <Grid item xs={12} md={6}>
                        <Paper
                            sx={{
                                p: 2,
                                height: '100%',
                                border: '1px solid',
                                borderColor: 'divider',
                                overflow: 'hidden'
                            }}
                        >
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                pb: 1,
                                borderBottom: '1px solid',
                                borderColor: 'divider'
                            }}>
                                <LeaderboardIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" component="h3">
                                    Lowest Team Gross Scores
                                </Typography>
                            </Box>

                            {rankingsData.topTeamGross.length > 0 ? (
                                <List disablePadding>
                                    {rankingsData.topTeamGross.map((score, index) => (
                                        <ListItem
                                            key={`team-gross-${score.team_id}-${index}`}
                                            sx={{
                                                px: 1,
                                                py: 0.5,
                                                backgroundColor: index % 2 === 0 ? 'action.hover' : 'transparent'
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    width: '100%'
                                                }}
                                            >
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        minWidth: '24px',
                                                        color: index === 0 ? 'warning.dark' : 'text.primary'
                                                    }}
                                                >
                                                    {index + 1}.
                                                </Typography>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                        {score.team_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {score.date ? formatDate(score.date, 'MMM d, yyyy') : 'Unknown date'} - {score.course_name || 'Unknown course'}
                                                    </Typography>
                                                </Box>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: 'success.main',
                                                        fontSize: index === 0 ? '1.2rem' : '1rem'
                                                    }}
                                                >
                                                    {score.score}
                                                </Typography>
                                            </Box>
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                    No team gross scores recorded yet
                                </Typography>
                            )}
                        </Paper>
                    </Grid>

                    {/* Team Net Scores */}
                    <Grid item xs={12} md={6}>
                        <Paper
                            sx={{
                                p: 2,
                                height: '100%',
                                border: '1px solid',
                                borderColor: 'divider',
                                overflow: 'hidden'
                            }}
                        >
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                pb: 1,
                                borderBottom: '1px solid',
                                borderColor: 'divider'
                            }}>
                                <LeaderboardIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" component="h3">
                                    Lowest Team Net Scores
                                </Typography>
                            </Box>

                            {rankingsData.topTeamNet.length > 0 ? (
                                <List disablePadding>
                                    {rankingsData.topTeamNet.map((score, index) => (
                                        <ListItem
                                            key={`team-net-${score.team_id}-${index}`}
                                            sx={{
                                                px: 1,
                                                py: 0.5,
                                                backgroundColor: index % 2 === 0 ? 'action.hover' : 'transparent'
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    width: '100%'
                                                }}
                                            >
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        minWidth: '24px',
                                                        color: index === 0 ? 'warning.dark' : 'text.primary'
                                                    }}
                                                >
                                                    {index + 1}.
                                                </Typography>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                        {score.team_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {score.date ? formatDate(score.date, 'MMM d, yyyy') : 'Unknown date'} - {score.course_name || 'Unknown course'}
                                                    </Typography>
                                                </Box>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: 'success.main',
                                                        fontSize: index === 0 ? '1.2rem' : '1rem'
                                                    }}
                                                >
                                                    {score.score}
                                                </Typography>
                                            </Box>
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                    No team net scores recorded yet
                                </Typography>
                            )}
                        </Paper>
                    </Grid>

                    {/* Most Improved Players - moved to bottom */}
                    <Grid item xs={12} md={6}>
                        <Paper
                            sx={{
                                p: 2,
                                height: '100%',
                                border: '1px solid',
                                borderColor: 'divider',
                                overflow: 'hidden'
                            }}
                        >
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                pb: 1,
                                borderBottom: '1px solid',
                                borderColor: 'divider'
                            }}>
                                <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" component="h3">
                                    Most Improved Players
                                </Typography>
                            </Box>

                            {rankingsData.mostImproved.length > 0 ? (
                                <List disablePadding>
                                    {rankingsData.mostImproved.map((player, index) => (
                                        <ListItem
                                            key={`improved-${player.player_id}-${index}`}
                                            sx={{
                                                px: 1,
                                                py: 0.5,
                                                backgroundColor: index % 2 === 0 ? 'action.hover' : 'transparent'
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    width: '100%'
                                                }}
                                            >
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        minWidth: '24px',
                                                        color: index === 0 ? 'warning.dark' : 'text.primary'
                                                    }}
                                                >
                                                    {index + 1}.
                                                </Typography>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                        {player.player_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Initial: {player.initial_avg?.toFixed(1) || 'N/A'} → Current: {player.overall_avg?.toFixed(1) || 'N/A'}
                                                    </Typography>
                                                </Box>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: 'success.main', // Changed from conditional color to match other rankings
                                                        fontSize: index === 0 ? '1.2rem' : '1rem'
                                                    }}
                                                >
                                                    {formatHandicapImprovement(player.handicap_improvement || player.improvement || 0)}
                                                </Typography>
                                            </Box>
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                    No improvement data available yet
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default Rankings;
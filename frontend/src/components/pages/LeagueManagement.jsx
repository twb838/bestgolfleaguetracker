import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Typography,
    Box,
    Button,
    Paper,
    Tabs,
    Tab,
    CircularProgress,
    Breadcrumbs,
    Link,
    Chip,
    Divider
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    SportsSoccer as TeamIcon,
    GolfCourse as CourseIcon,
    Event as EventIcon,
    EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import env from '../../config/env';

function LeagueManagement() {
    const { leagueId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // League data - try to use passed state or fetch if not available
    const [league, setLeague] = useState(location.state?.league || null);
    const [loading, setLoading] = useState(!location.state?.league);
    const [error, setError] = useState(null);

    // UI state
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        // If league data wasn't passed via navigation state, fetch it
        if (!league) {
            fetchLeagueDetails();
        }
    }, [leagueId]);

    const fetchLeagueDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${env.API_ENDPOINTS.LEAGUES}/${leagueId}`);

            if (!response.ok) {
                throw new Error('League not found');
            }

            const data = await response.json();
            setLeague(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching league details:', error);
            setError('Failed to load league details. Please try again later.');
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleBackClick = () => {
        navigate('/leagues');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ my: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleBackClick}>
                    Back to Leagues
                </Button>
                <Paper sx={{ p: 3, mt: 2, textAlign: 'center' }}>
                    <Typography color="error">{error}</Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <div>
            <Box sx={{ mb: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleBackClick}>
                    Back to Leagues
                </Button>
            </Box>

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    {league.name}
                </Typography>

                {league.description && (
                    <Typography variant="body1" color="text.secondary" paragraph>
                        {league.description}
                    </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Chip
                        icon={<TeamIcon />}
                        label={`${league.teams?.length || 0} Teams`}
                    />
                    <Chip
                        icon={<CourseIcon />}
                        label={`${league.courses?.length || 0} Courses`}
                    />
                </Box>
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab icon={<EventIcon />} label="Schedule" />
                    <Tab icon={<TrophyIcon />} label="Standings" />
                    <Tab icon={<TeamIcon />} label="Teams" />
                    <Tab icon={<CourseIcon />} label="Courses" />
                </Tabs>
            </Paper>

            {/* Tab Content */}
            <Paper sx={{ p: 3 }}>
                {activeTab === 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            League Schedule
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            No matches scheduled yet. Check back later or create a schedule.
                        </Typography>
                    </Box>
                )}

                {activeTab === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            League Standings
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            No standings available yet. Standings will appear after matches are played.
                        </Typography>
                    </Box>
                )}

                {activeTab === 2 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Teams in this League
                        </Typography>
                        {league.teams && league.teams.length > 0 ? (
                            <ul>
                                {league.teams.map(team => (
                                    <li key={team.id}>
                                        <Typography>{team.name}</Typography>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No teams assigned to this league.
                            </Typography>
                        )}
                    </Box>
                )}

                {activeTab === 3 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Courses in this League
                        </Typography>
                        {league.courses && league.courses.length > 0 ? (
                            <ul>
                                {league.courses.map(course => (
                                    <li key={course.id}>
                                        <Typography>{course.name}</Typography>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No courses assigned to this league.
                            </Typography>
                        )}
                    </Box>
                )}
            </Paper>
        </div>
    );
}

export default LeagueManagement;
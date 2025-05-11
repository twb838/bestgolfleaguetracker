import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
    AppBar, Toolbar, Typography, Button, Container, Box,
    IconButton, Menu, MenuItem, useMediaQuery, useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import './App.css';

// Import pages
import Teams from './pages/Teams';
import Courses from './pages/Courses';
import Leagues from './pages/Leagues';
import Dashboard from './pages/Dashboard';
import LeagueManagement from './pages/LeagueManagement';
import MatchScoreEntry from './pages/MatchScoreEntry';
import Players from './pages/Players';
import TeamScoreEntry from './pages/TeamScoreEntry';

function App() {
    const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleOpenMobileMenu = (event) => {
        setMobileMenuAnchor(event.currentTarget);
    };

    const handleCloseMobileMenu = () => {
        setMobileMenuAnchor(null);
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: <HomeIcon fontSize="small" /> },
        { name: 'Players', path: '/players', icon: <PersonIcon fontSize="small" /> },
        { name: 'Teams', path: '/teams', icon: <GroupIcon fontSize="small" /> },
        { name: 'Courses', path: '/courses', icon: <GolfCourseIcon fontSize="small" /> },
        { name: 'Leagues', path: '/leagues', icon: <EmojiEventsIcon fontSize="small" /> },
    ];

    return (
        <Router>
            <div className="App">
                <AppBar position="static">
                    <Toolbar variant="dense">
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{
                                flexGrow: 0,
                                mr: { xs: 1, sm: 2 },
                                fontSize: { xs: '1rem', sm: '1.25rem' }
                            }}
                        >
                            Golf Tracker
                        </Typography>

                        {isMobile ? (
                            <>
                                <Box sx={{ flexGrow: 1 }} />
                                <IconButton
                                    size="large"
                                    edge="end"
                                    color="inherit"
                                    aria-label="menu"
                                    onClick={handleOpenMobileMenu}
                                >
                                    <MenuIcon />
                                </IconButton>
                                <Menu
                                    anchorEl={mobileMenuAnchor}
                                    open={Boolean(mobileMenuAnchor)}
                                    onClose={handleCloseMobileMenu}
                                    keepMounted
                                >
                                    {navItems.map((item) => (
                                        <MenuItem
                                            key={item.name}
                                            component={Link}
                                            to={item.path}
                                            onClick={handleCloseMobileMenu}
                                            sx={{ minWidth: 150 }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {item.icon}
                                                <Typography sx={{ ml: 1 }}>{item.name}</Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </>
                        ) : (
                            <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
                                {navItems.map((item) => (
                                    <Button
                                        key={item.name}
                                        color="inherit"
                                        component={Link}
                                        to={item.path}
                                        size="small"
                                        startIcon={item.icon}
                                        sx={{
                                            px: 1,
                                            py: 0.5,
                                            minWidth: 'auto',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        {item.name}
                                    </Button>
                                ))}
                            </Box>
                        )}
                    </Toolbar>
                </AppBar>

                <Container sx={{ mt: 2, px: { xs: 1, sm: 2, md: 3 } }}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/players" element={<Players />} />
                        <Route path="/teams" element={<Teams />} />
                        <Route path="/courses" element={<Courses />} />
                        <Route path="/leagues" element={<Leagues />} />
                        <Route path="/leagues/:leagueId" element={<LeagueManagement />} />
                        <Route path="/matches/:matchId/scores" element={<MatchScoreEntry />} />
                        <Route path="/score-entry/:matchId/team/:token" element={<TeamScoreEntry />} />
                    </Routes>
                </Container>
            </div>
        </Router>
    );
}

export default App;
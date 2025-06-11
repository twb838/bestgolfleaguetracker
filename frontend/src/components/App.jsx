import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

import {
    AppBar, Toolbar, Typography, Button, Container, Box,
    IconButton, Menu, MenuItem, useMediaQuery, useTheme,
    Avatar, Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import './App.css';

// Import pages
import Teams from './pages/Teams';
import Courses from './pages/Courses';
import Leagues from './pages/leagues/Leagues';
import LeagueManagement from './pages/leagues/LeagueManagement';
import MatchScoreEntry from './pages/leagues/MatchScoreEntry';
import Players from './pages/Players';
import TeamScoreEntry from './pages/leagues/TeamScoreEntry';
import PrinterFriendlyLeagueSummary from './pages/leagues/PrinterFriendlyLeagueSummary';
import Tournaments from './pages/tournaments/Tournaments';
import TournamentManagement from './pages/tournaments/TournamentManagement';
import TournamentCreationWizard from './pages/tournaments/TournamentCreationWizard';
import Scorecard from './pages/tournaments/Scorecard';
import LeagueSettings from './pages/leagues/LeagueSettings';
import MatchupMatrix from './pages/leagues/MatchupMatrix';
import Marketing from './pages/Marketing';

// Create a layout wrapper component
const AppLayout = ({ children }) => {
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);

    const { user, logout, isAuthenticated } = useAuth();

    // Check if current route should use minimal layout or is login page
    const isMinimalLayout = location.pathname.includes('/score-entry/');
    const isLoginPage = location.pathname === '/login';
    const isMarketingPage = location.pathname === '/';

    const handleOpenMobileMenu = (event) => {
        setMobileMenuAnchor(event.currentTarget);
    };

    const handleCloseMobileMenu = () => {
        setMobileMenuAnchor(null);
    };

    const handleOpenUserMenu = (event) => {
        setUserMenuAnchor(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setUserMenuAnchor(null);
    };

    const handleLogout = () => {
        handleCloseUserMenu();
        logout();
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <HomeIcon fontSize="small" /> },
        { name: 'Players', path: '/players', icon: <PersonIcon fontSize="small" /> },
        { name: 'Teams', path: '/teams', icon: <GroupIcon fontSize="small" /> },
        { name: 'Courses', path: '/courses', icon: <GolfCourseIcon fontSize="small" /> },
        { name: 'Leagues', path: '/leagues', icon: <EmojiEventsIcon fontSize="small" /> },
        { name: 'Tournaments', path: '/tournaments', icon: <EmojiEventsIcon fontSize="small" /> },
    ];

    // If minimal layout, login page, or marketing page, only render children without navigation
    if (isMinimalLayout || isLoginPage || isMarketingPage) {
        return (
            <div className="App">
                {children}
            </div>
        );
    }

    // Otherwise render full layout with navigation
    return (
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
                        🏌️ GolfClubTrack
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

                    {/* User Profile Menu */}
                    {isAuthenticated && (
                        <>
                            <IconButton
                                onClick={handleOpenUserMenu}
                                color="inherit"
                                size="small"
                                sx={{ ml: 1 }}
                            >
                                {user?.first_name ? (
                                    <Avatar
                                        sx={{
                                            bgcolor: 'secondary.main',
                                            width: 32,
                                            height: 32,
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        {user.first_name.charAt(0).toUpperCase()}
                                        {user.last_name ? user.last_name.charAt(0).toUpperCase() : ''}
                                    </Avatar>
                                ) : (
                                    <AccountCircleIcon />
                                )}
                            </IconButton>
                            <Menu
                                anchorEl={userMenuAnchor}
                                open={Boolean(userMenuAnchor)}
                                onClose={handleCloseUserMenu}
                                onClick={handleCloseUserMenu}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            >
                                <MenuItem disabled>
                                    <Typography variant="body2" color="text.secondary">
                                        Signed in as <strong>{user?.username}</strong>
                                    </Typography>
                                </MenuItem>
                                <Divider />
                                <MenuItem component={Link} to="/profile">
                                    <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                                    Profile
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                                    Logout
                                </MenuItem>
                            </Menu>
                        </>
                    )}

                    {/* Login button for unauthenticated users */}
                    {!isAuthenticated && (
                        <Button
                            color="inherit"
                            component={Link}
                            to="/login"
                            size="small"
                        >
                            Login
                        </Button>
                    )}
                </Toolbar>
            </AppBar>

            <Container sx={{ mt: 2, px: { xs: 1, sm: 2, md: 3 } }}>
                {children}
            </Container>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppLayout>
                    <Routes>
                        {/* Marketing page at root */}
                        <Route path="/" element={<Marketing />} />

                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />

                        {/* Protected Routes */}
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        } />
                        <Route path="/players" element={
                            <ProtectedRoute>
                                <Players />
                            </ProtectedRoute>
                        } />
                        <Route path="/teams" element={
                            <ProtectedRoute>
                                <Teams />
                            </ProtectedRoute>
                        } />
                        <Route path="/courses" element={
                            <ProtectedRoute>
                                <Courses />
                            </ProtectedRoute>
                        } />
                        <Route path="/leagues" element={
                            <ProtectedRoute>
                                <Leagues />
                            </ProtectedRoute>
                        } />
                        <Route path="/leagues/:leagueId" element={
                            <ProtectedRoute>
                                <LeagueManagement />
                            </ProtectedRoute>
                        } />
                        <Route path="/leagues/:leagueId/print" element={
                            <ProtectedRoute>
                                <PrinterFriendlyLeagueSummary />
                            </ProtectedRoute>
                        } />
                        <Route path="/matches/:matchId/scores" element={
                            <ProtectedRoute>
                                <MatchScoreEntry />
                            </ProtectedRoute>
                        } />
                        <Route path="/score-entry/:matchId/team/:token" element={<TeamScoreEntry />} />
                        <Route path="/tournaments" element={
                            <ProtectedRoute>
                                <Tournaments />
                            </ProtectedRoute>
                        } />
                        <Route path="/tournaments/create" element={
                            <ProtectedRoute>
                                <TournamentCreationWizard />
                            </ProtectedRoute>
                        } />
                        <Route path="/tournaments/:tournamentId" element={
                            <ProtectedRoute>
                                <TournamentManagement />
                            </ProtectedRoute>
                        } />
                        <Route path="/tournaments/:tournamentId/scorecard" element={<Scorecard />} />
                        <Route path="/leagues/:leagueId/settings" element={<LeagueSettings />} />
                        <Route path="/leagues/:leagueId/matchup-matrix" element={<MatchupMatrix />} />
                        {/* Catch all - redirect to marketing page for unauthenticated, dashboard for authenticated */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AppLayout>
            </Router>
        </AuthProvider>
    );
}

export default App;
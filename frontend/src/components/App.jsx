import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import './App.css';

// Import pages (we'll create these next)
import Teams from './pages/Teams';
import Courses from './pages/Courses';
import Leagues from './pages/Leagues';
import Dashboard from './pages/Dashboard';
import LeagueManagement from './pages/LeagueManagement';
import MatchScoreEntry from './pages/MatchScoreEntry';
import Players from './pages/Players'; // Add this import

function App() {
    return (
        <Router>
            <div className="App">
                <AppBar position="static">
                    <Toolbar>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
                            Golf Tracker
                        </Typography>
                        <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
                            <Button color="inherit" component={Link} to="/">
                                Dashboard
                            </Button>
                            <Button color="inherit" component={Link} to="/players">
                                Players
                            </Button>
                            <Button color="inherit" component={Link} to="/teams">
                                Teams
                            </Button>
                            <Button color="inherit" component={Link} to="/courses">
                                Courses
                            </Button>
                            <Button color="inherit" component={Link} to="/leagues">
                                Leagues
                            </Button>
                        </Box>
                    </Toolbar>
                </AppBar>
                <Container sx={{ mt: 4 }}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/players" element={<Players />} />
                        <Route path="/teams" element={<Teams />} />
                        <Route path="/courses" element={<Courses />} />
                        <Route path="/leagues" element={<Leagues />} />
                        <Route path="/leagues/:leagueId" element={<LeagueManagement />} />
                        <Route path="/matches/:matchId/scores" element={<MatchScoreEntry />} />
                    </Routes>
                </Container>
            </div>
        </Router>
    );
}

export default App;
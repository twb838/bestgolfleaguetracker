import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography, Paper, Alert } from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import env from '../../config/env';

// Import components
import { MatchHeader, MatchScorecard, MatchResults, SubstituteDialog } from './MatchScoreEntry/';

// Utility functions
const prepareHolesForHandicaps = (holes) => {
    if (!holes || holes.length === 0) return [];

    const holesWithHandicaps = holes
        .filter(hole => hole.handicap !== null && hole.handicap !== undefined)
        .map(hole => ({
            id: hole.id,
            handicap: hole.handicap
        }));

    return holesWithHandicaps.sort((a, b) => a.handicap - b.handicap);
};

const MatchScoreEntry = () => {
    const { matchId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // State variables (keep all the state in the main component)
    const [match, setMatch] = useState(location.state?.match || null);
    const [league, setLeague] = useState(location.state?.league || null);
    const [loading, setLoading] = useState(!location.state?.match);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editMode, setEditMode] = useState(false);

    const [homeTeamScores, setHomeTeamScores] = useState([]);
    const [awayTeamScores, setAwayTeamScores] = useState([]);
    const [course, setCourse] = useState(null);
    const [holes, setHoles] = useState([]);

    const [matchResults, setMatchResults] = useState(null);

    const [substituteDialogOpen, setSubstituteDialogOpen] = useState(false);
    const [currentSubstitute, setCurrentSubstitute] = useState({
        teamType: null,
        playerIndex: null,
        originalPlayer: null,
        substitute: {
            player_name: '',
            first_name: '',
            last_name: '',
            email: '',
            handicap: 0,
            is_substitute: true
        }
    });
    const [availablePlayers, setAvailablePlayers] = useState([]);

    // Derived state
    const sortedHolesByHandicap = useMemo(() => {
        return prepareHolesForHandicaps(holes);
    }, [holes]);

    // Keep all the utility functions from your original component
    // (fetchMatchDetails, initializeTeamScores, fetchCourseHoles, etc.)

    // Keep all the handlers (handleScoreChange, handleBack, toggleEditMode, etc.)

    // Copy all your existing functions here:
    const fetchMatchDetails = async () => {
        // Your existing implementation
    };

    const initializeTeamScores = (homeTeamData, awayTeamData, matchData) => {
        // Your existing implementation
    };

    const fetchCourseHoles = async (courseId) => {
        // Your existing implementation
    };

    const initializePlayerScores = async (matchData = match, leagueData = league) => {
        // Your existing implementation
    };

    const formatPlayerName = (player) => {
        // Your existing implementation
    };

    const fetchExistingScores = async (matchId) => {
        // Your existing implementation
    };

    const handleScoreChange = (teamType, playerIndex, holeId, value) => {
        // Your existing implementation
    };

    const getNextInputField = (teamType, currentPlayerIndex, currentHoleId) => {
        // Your existing implementation
    };

    const handleTabChange = (event, newValue) => {
        // Your existing implementation
    };

    const handleBack = () => {
        // Your existing implementation
    };

    const calculatePlayerTotal = (playerScores) => {
        // Your existing implementation
    };

    const calculatePar = () => {
        // Your existing implementation
    };

    const calculateMatchResults = () => {
        // Your existing implementation
    };

    const toggleEditMode = async () => {
        // Your existing implementation
    };

    const handleSaveScores = async () => {
        // Your existing implementation
    };

    const calculatePlayerPops = (teamScores, otherTeamScores = []) => {
        // Your existing implementation
    };

    const calculateNetScore = (score, pops, hole) => {
        // Your existing implementation
    };

    const calculateTeamNetTotal = (players) => {
        // Your existing implementation
    };

    const handleOpenSubstituteDialog = (teamType, playerIndex) => {
        // Your existing implementation
    };

    const handleCloseSubstituteDialog = () => {
        // Your existing implementation
    };

    const handleSubstituteChange = (e) => {
        // Your existing implementation
    };

    const handleSelectExistingPlayer = (playerId) => {
        // Your existing implementation
    };

    const handleApplySubstitute = async () => {
        // Your existing implementation
    };

    const fetchAvailablePlayers = async () => {
        // Your existing implementation
    };

    // Effects
    useEffect(() => {
        // If we don't have match data from navigation, fetch it
        if (!match) {
            fetchMatchDetails();
        } else {
            // If we have the match data, fetch the match course holes
            fetchCourseHoles();

            // Initialize player scores if we have league and match data
            if (league && match) {
                initializePlayerScores();
            }
        }
    }, [matchId, match]);

    useEffect(() => {
        if (match && homeTeamScores.length > 0 && awayTeamScores.length > 0 && holes.length > 0) {
            calculateMatchResults();
        }
    }, [homeTeamScores, awayTeamScores, holes]);

    // Render loading state
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    // Render error state
    if (error && !match) {
        return (
            <Box sx={{ my: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
                    Back
                </Button>
                <Paper sx={{ p: 3, mt: 2, textAlign: 'center' }}>
                    <Typography color="error">{error}</Typography>
                </Paper>
            </Box>
        );
    }

    // Main component render
    return (
        <Box sx={{ pb: 4 }}>
            <MatchHeader
                match={match}
                error={error}
                successMessage={successMessage}
                saving={saving}
                editMode={editMode}
                handleBack={handleBack}
                handleSaveScores={handleSaveScores}
                toggleEditMode={toggleEditMode}
            />

            <MatchScorecard
                match={match}
                homeTeamScores={homeTeamScores}
                awayTeamScores={awayTeamScores}
                holes={holes}
                editMode={editMode}
                handleScoreChange={handleScoreChange}
                handleOpenSubstituteDialog={handleOpenSubstituteDialog}
                calculateNetScore={calculateNetScore}
                calculatePlayerTotal={calculatePlayerTotal}
                calculatePar={calculatePar}
            />

            <MatchResults
                results={matchResults}
                calculateMatchResults={calculateMatchResults}
            />

            {!match.is_completed && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveScores}
                        disabled={saving}
                        size="large"
                    >
                        {saving ? 'Saving...' : 'Save All Scores'}
                    </Button>
                </Box>
            )}

            <SubstituteDialog
                open={substituteDialogOpen}
                onClose={handleCloseSubstituteDialog}
                currentSubstitute={currentSubstitute}
                availablePlayers={availablePlayers}
                onSubstituteChange={handleSubstituteChange}
                onSelectExistingPlayer={handleSelectExistingPlayer}
                onApplySubstitute={handleApplySubstitute}
            />
        </Box>
    );
};

export default MatchScoreEntry;
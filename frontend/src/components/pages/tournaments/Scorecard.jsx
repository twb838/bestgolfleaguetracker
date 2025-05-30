import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography,
    Box,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Save as SaveIcon,
    Add as AddIcon,
    GolfCourse as GolfCourseIcon,
    Person as PersonIcon,
    Group as GroupIcon
} from '@mui/icons-material';
import { get, post, put } from '../../../services/api';

function Scorecard() {
    const { tournamentId } = useParams();
    const navigate = useNavigate();

    const [tournament, setTournament] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [teams, setTeams] = useState([]);
    const [courses, setCourses] = useState([]);
    const [participantType, setParticipantType] = useState('individual'); // 'individual' or 'team'
    const [selectedDay, setSelectedDay] = useState(1);
    const [selectedParticipant, setSelectedParticipant] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('');
    const [selectedTeamPlayer, setSelectedTeamPlayer] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [scores, setScores] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [addParticipantOpen, setAddParticipantOpen] = useState(false);
    const [newParticipantData, setNewParticipantData] = useState({
        player_name: '',
        handicap: ''
    });

    useEffect(() => {
        fetchTournamentData();
    }, [tournamentId]);

    useEffect(() => {
        const participantId = participantType === 'individual' ? selectedParticipant : selectedTeamPlayer;
        if (participantId && selectedDay && selectedCourse) {
            fetchScorecard(participantId);
        }
    }, [selectedParticipant, selectedTeamPlayer, selectedDay, selectedCourse, participantType]);

    const fetchTournamentData = async () => {
        try {
            setLoading(true);
            const [tournamentData, participantsData, teamsData, coursesData] = await Promise.all([
                get(`/tournaments/${tournamentId}`),
                get(`/tournaments/${tournamentId}/participants`),
                get(`/tournaments/${tournamentId}/teams`),
                get(`/tournaments/${tournamentId}/courses`)
            ]);

            setTournament(tournamentData);
            setParticipants(participantsData);
            setTeams(teamsData);
            setCourses(coursesData);

            // Set default participant type based on tournament
            if (tournamentData.participant_type === 'TEAM') {
                setParticipantType('team');
            } else if (tournamentData.participant_type === 'INDIVIDUAL') {
                setParticipantType('individual');
            }
            // For MIXED tournaments, let user choose

            // Auto-select first course if only one exists
            if (coursesData.length === 1) {
                setSelectedCourse(coursesData[0].id);
            }
        } catch (error) {
            console.error('Error fetching tournament data:', error);
            setError('Failed to load tournament data');
        } finally {
            setLoading(false);
        }
    };

    const fetchScorecard = async (participantId) => {
        try {
            const data = await get(`/tournaments/${tournamentId}/scorecards/${participantId}/${selectedDay}/${selectedCourse}`);
            setScores(data.scores || {});
        } catch (error) {
            // If scorecard doesn't exist, start with empty scores
            setScores({});
        }
    };

    const handleScoreChange = (holeNumber, value) => {
        setScores(prev => ({
            ...prev,
            [holeNumber]: value === '' ? null : parseInt(value)
        }));
    };

    const handleSaveScorecard = async () => {
        try {
            setSaving(true);
            setError(null);

            const participantId = participantType === 'individual' ? selectedParticipant : selectedTeamPlayer;
            const teamId = participantType === 'team' ? selectedTeam : null;

            const scorecardData = {
                tournament_id: parseInt(tournamentId),
                participant_id: parseInt(participantId),
                team_id: teamId ? parseInt(teamId) : null,
                day: selectedDay,
                course_id: parseInt(selectedCourse),
                scores: scores,
                participant_type: participantType
            };

            await post(`/tournaments/${tournamentId}/scorecards`, scorecardData);
            setSuccessMessage('Scorecard saved successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error saving scorecard:', error);
            setError('Failed to save scorecard');
        } finally {
            setSaving(false);
        }
    };

    const handleAddParticipant = async () => {
        try {
            const participantData = {
                tournament_id: tournamentId,
                player_name: newParticipantData.player_name,
                handicap: parseFloat(newParticipantData.handicap) || 0
            };

            const newParticipant = await post(`/tournaments/${tournamentId}/participants`, participantData);
            setParticipants(prev => [...prev, newParticipant]);
            setAddParticipantOpen(false);
            setNewParticipantData({ player_name: '', handicap: '' });

            if (participantType === 'individual') {
                setSelectedParticipant(newParticipant.id);
            }
        } catch (error) {
            console.error('Error adding participant:', error);
            setError('Failed to add participant');
        }
    };

    const handleParticipantTypeChange = (event, newType) => {
        if (newType !== null) {
            setParticipantType(newType);
            // Clear selections when switching types
            setSelectedParticipant('');
            setSelectedTeam('');
            setSelectedTeamPlayer('');
            setScores({});
        }
    };

    const handleTeamChange = (teamId) => {
        setSelectedTeam(teamId);
        setSelectedTeamPlayer(''); // Reset team player selection
        setScores({});
    };

    const calculateTotal = () => {
        return Object.values(scores).reduce((total, score) => {
            return total + (score || 0);
        }, 0);
    };

    const getSelectedCourse = () => {
        return courses.find(course => course.id === selectedCourse);
    };

    const getSelectedTeamData = () => {
        return teams.find(team => team.id === selectedTeam);
    };

    const getCurrentPlayerName = () => {
        if (participantType === 'individual') {
            const participant = participants.find(p => p.id === selectedParticipant);
            return participant?.player_name || '';
        } else {
            const teamData = getSelectedTeamData();
            const player = teamData?.players.find(p => p.id === selectedTeamPlayer);
            return player?.player_name || '';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    const selectedCourseData = getSelectedCourse();
    const holes = selectedCourseData?.holes || [];
    const selectedTeamData = getSelectedTeamData();

    // Show participant type selector only for MIXED tournaments
    const showParticipantTypeSelector = tournament?.participant_type === 'MIXED';

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(`/tournaments/${tournamentId}`)}
                >
                    Back to Tournament
                </Button>
                <Typography variant="h4" component="h1">
                    Scorecard Entry - {tournament?.name}
                </Typography>
                <Box />
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                </Alert>
            )}

            {/* Selection Controls */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Select Scorecard
                </Typography>

                {/* Participant Type Selector (only for MIXED tournaments) */}
                {showParticipantTypeSelector && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Participant Type
                        </Typography>
                        <ToggleButtonGroup
                            value={participantType}
                            exclusive
                            onChange={handleParticipantTypeChange}
                            aria-label="participant type"
                        >
                            <ToggleButton value="individual" aria-label="individual">
                                <PersonIcon sx={{ mr: 1 }} />
                                Individual
                            </ToggleButton>
                            <ToggleButton value="team" aria-label="team">
                                <GroupIcon sx={{ mr: 1 }} />
                                Team
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {/* Individual Participant Selection */}
                    {participantType === 'individual' && (
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel>Participant</InputLabel>
                            <Select
                                value={selectedParticipant}
                                onChange={(e) => setSelectedParticipant(e.target.value)}
                                label="Participant"
                            >
                                {participants.map(participant => (
                                    <MenuItem key={participant.id} value={participant.id}>
                                        {participant.player_name} (HC: {participant.handicap})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {/* Team Selection */}
                    {participantType === 'team' && (
                        <>
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel>Team</InputLabel>
                                <Select
                                    value={selectedTeam}
                                    onChange={(e) => handleTeamChange(e.target.value)}
                                    label="Team"
                                >
                                    {teams.map(team => (
                                        <MenuItem key={team.id} value={team.id}>
                                            {team.name} ({team.player_count} players)
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {selectedTeam && selectedTeamData && selectedTeamData.players && (
                                <FormControl sx={{ minWidth: 200 }}>
                                    <InputLabel>Team Player</InputLabel>
                                    <Select
                                        value={selectedTeamPlayer}
                                        onChange={(e) => setSelectedTeamPlayer(e.target.value)}
                                        label="Team Player"
                                    >
                                        {selectedTeamData.players.map(player => (
                                            <MenuItem key={player.id} value={player.id}>
                                                {player.player_name} (HC: {player.handicap})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </>
                    )}

                    <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel>Day</InputLabel>
                        <Select
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(e.target.value)}
                            label="Day"
                        >
                            {Array.from({ length: tournament?.number_of_days || 1 }, (_, i) => (
                                <MenuItem key={i + 1} value={i + 1}>
                                    Day {i + 1}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Course</InputLabel>
                        <Select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            label="Course"
                        >
                            {courses.map(course => (
                                <MenuItem key={course.id} value={course.id}>
                                    {course.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setAddParticipantOpen(true)}
                    >
                        Add Participant
                    </Button>
                </Box>
            </Paper>

            {/* Scorecard */}
            {((participantType === 'individual' && selectedParticipant) ||
                (participantType === 'team' && selectedTeamPlayer)) &&
                selectedCourse && holes.length > 0 ? (
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            <GolfCourseIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            {selectedCourseData?.name} - Day {selectedDay}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Chip
                                label={getCurrentPlayerName()}
                                color="secondary"
                                size="large"
                            />
                            {participantType === 'team' && (
                                <Chip
                                    label={selectedTeamData?.name}
                                    color="primary"
                                    variant="outlined"
                                    size="large"
                                />
                            )}
                            <Chip
                                label={`Total: ${calculateTotal()}`}
                                color="primary"
                                size="large"
                            />
                        </Box>
                    </Box>

                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Hole</TableCell>
                                    {holes.map(hole => (
                                        <TableCell
                                            key={hole.hole_number}
                                            align="center"
                                            sx={{ color: 'white', fontWeight: 'bold' }}
                                        >
                                            {hole.hole_number}
                                        </TableCell>
                                    ))}
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                                        Total
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Par</TableCell>
                                    {holes.map(hole => (
                                        <TableCell key={hole.hole_number} align="center">
                                            {hole.par}
                                        </TableCell>
                                    ))}
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                        {holes.reduce((total, hole) => total + hole.par, 0)}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Score</TableCell>
                                    {holes.map(hole => (
                                        <TableCell key={hole.hole_number} align="center">
                                            <TextField
                                                type="number"
                                                size="small"
                                                value={scores[hole.hole_number] || ''}
                                                onChange={(e) => handleScoreChange(hole.hole_number, e.target.value)}
                                                inputProps={{
                                                    min: 1,
                                                    max: 15,
                                                    style: { textAlign: 'center' }
                                                }}
                                                sx={{ width: 60 }}
                                            />
                                        </TableCell>
                                    ))}
                                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                        {calculateTotal()}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveScorecard}
                            disabled={saving || Object.keys(scores).length === 0}
                            size="large"
                        >
                            {saving ? 'Saving...' : 'Save Scorecard'}
                        </Button>
                    </Box>
                </Paper>
            ) : (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                        Please select a {participantType === 'team' ? 'team and player' : 'participant'} and course to enter scores.
                    </Typography>
                </Paper>
            )}

            {/* Add Participant Dialog */}
            <Dialog open={addParticipantOpen} onClose={() => setAddParticipantOpen(false)}>
                <DialogTitle>Add Tournament Participant</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Player Name"
                        value={newParticipantData.player_name}
                        onChange={(e) => setNewParticipantData(prev => ({
                            ...prev,
                            player_name: e.target.value
                        }))}
                        sx={{ mb: 2, mt: 1 }}
                    />
                    <TextField
                        fullWidth
                        label="Handicap"
                        type="number"
                        value={newParticipantData.handicap}
                        onChange={(e) => setNewParticipantData(prev => ({
                            ...prev,
                            handicap: e.target.value
                        }))}
                        inputProps={{ step: 0.1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddParticipantOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleAddParticipant}
                        variant="contained"
                        disabled={!newParticipantData.player_name}
                    >
                        Add Participant
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Scorecard;
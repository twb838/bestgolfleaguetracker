import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Stepper, Step, StepLabel, Button, Paper,
    TextField, FormControl, InputLabel, Select, MenuItem,
    FormControlLabel, Checkbox, Radio, RadioGroup,
    FormLabel, Grid, Divider, Alert, Chip, IconButton,
    CircularProgress, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
    EmojiEvents as TrophyIcon,
    FlightTakeoff as FlightIcon,
    Group as GroupIcon,
    Timer as TimerIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, addDays, parseISO } from 'date-fns';
import { get, post } from '../../../services/api';

// Create a date formatting utility
const formatDate = (dateString, formatPattern) => {
    if (!dateString) return '';
    try {
        return format(parseISO(dateString), formatPattern);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
};

function TournamentCreationWizard() {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [courses, setCourses] = useState([]);
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);

    // Tournament data state
    const [tournamentData, setTournamentData] = useState({
        name: '',
        description: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
        format: 'stroke_play',
        scoring_type: 'gross',
        number_of_days: 1,
        // Updated flight options
        flight_method: 'none', // 'none', 'pre_handicap', 'post_scores'
        number_of_flights: 0,
        auto_flight_size: 16, // Target size for auto-created flights
        courses: [],
        individual_participants: [],
        teams: [],
        handicap_allowance: 100,
        participant_type: 'individual',
        team_size: 0
    });

    // Flight state for pre-handicap flights
    const [preFlights, setPreFlights] = useState([
        { name: 'Flight A', min_handicap: 0, max_handicap: 9 },
        { name: 'Flight B', min_handicap: 10, max_handicap: 18 },
        { name: 'Flight C', min_handicap: 19, max_handicap: 36 }
    ]);

    // Steps for the wizard
    const steps = [
        'Basic Information',
        'Format & Scoring',
        'Courses & Schedule',
        'Participants',
        'Review & Create'
    ];

    // Fetch courses, players, and teams data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setFetchingData(true);
                setFetchError(null);

                const [coursesData, playersData, teamsData] = await Promise.all([
                    get('/courses'),
                    get('/players'),
                    get('/teams')
                ]);

                setCourses(coursesData);
                setPlayers(playersData);
                setTeams(teamsData);
            } catch (error) {
                console.error('Error fetching data:', error);
                setFetchError(error.message || 'Failed to fetch required data');
            } finally {
                setFetchingData(false);
            }
        };

        fetchData();
    }, []);

    // Handle input changes
    const handleInputChange = (event) => {
        const { name, value } = event.target;

        if (name === 'number_of_days') {
            const numDays = parseInt(value, 10);
            const startDate = new Date(tournamentData.start_date);
            const endDate = addDays(startDate, numDays - 1);

            setTournamentData({
                ...tournamentData,
                [name]: numDays,
                end_date: format(endDate, 'yyyy-MM-dd')
            });
        } else if (name === 'start_date') {
            const startDate = new Date(value);
            const endDate = addDays(startDate, tournamentData.number_of_days - 1);

            setTournamentData({
                ...tournamentData,
                [name]: value,
                end_date: format(endDate, 'yyyy-MM-dd')
            });
        } else if (name === 'flight_method') {
            // Reset flight-related data when method changes
            let updates = {
                flight_method: value,
                number_of_flights: value === 'none' ? 0 : (value === 'pre_handicap' ? 3 : 0)
            };

            setTournamentData({
                ...tournamentData,
                ...updates
            });

            // Reset pre-flights to default if switching to pre-handicap method
            if (value === 'pre_handicap') {
                setPreFlights([
                    { name: 'Flight A', min_handicap: 0, max_handicap: 9 },
                    { name: 'Flight B', min_handicap: 10, max_handicap: 18 },
                    { name: 'Flight C', min_handicap: 19, max_handicap: 36 }
                ]);
            }
        } else {
            setTournamentData({
                ...tournamentData,
                [name]: value
            });
        }
    };

    // Handle pre-flight changes
    const handlePreFlightChange = (index, field, value) => {
        const newFlights = [...preFlights];
        newFlights[index] = {
            ...newFlights[index],
            [field]: value
        };
        setPreFlights(newFlights);
    };

    // Add a pre-flight
    const addPreFlight = () => {
        if (preFlights.length < 6) {
            const lastFlight = preFlights[preFlights.length - 1];
            const newMaxHandicap = Math.min(lastFlight.max_handicap + 9, 36);
            setPreFlights([
                ...preFlights,
                {
                    name: `Flight ${String.fromCharCode(65 + preFlights.length)}`,
                    min_handicap: lastFlight.max_handicap + 1,
                    max_handicap: newMaxHandicap
                }
            ]);
            setTournamentData({
                ...tournamentData,
                number_of_flights: preFlights.length + 1
            });
        }
    };

    // Remove a pre-flight
    const removePreFlight = (index) => {
        if (preFlights.length > 1) {
            const newFlights = preFlights.filter((_, i) => i !== index);
            setPreFlights(newFlights);
            setTournamentData({
                ...tournamentData,
                number_of_flights: newFlights.length
            });
        }
    };

    // Handle course selection
    const handleCourseSelection = (event) => {
        const { value } = event.target;
        setTournamentData({
            ...tournamentData,
            courses: value
        });
    };

    // For individual participants
    const handleIndividualParticipantSelection = (event) => {
        setTournamentData({
            ...tournamentData,
            individual_participants: event.target.value
        });
    };

    // For teams
    const handleTeamSelection = (event) => {
        setTournamentData({
            ...tournamentData,
            teams: event.target.value
        });
    };

    // Handle step navigation
    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    // Create tournament
    const handleCreateTournament = async () => {
        setLoading(true);
        try {
            // Prepare tournament data based on flight method
            const tournamentPayload = {
                ...tournamentData,
                // Only include pre-flights if using pre-handicap method
                flights: tournamentData.flight_method === 'pre_handicap' ? preFlights : []
            };

            const data = await post('/tournaments', tournamentPayload);
            navigate(`/tournaments/${data.id}`);
        } catch (error) {
            console.error('Error creating tournament:', error);
            setFetchError(error.message || 'Failed to create tournament');
        } finally {
            setLoading(false);
        }
    };

    // Cancel and go back to tournaments list
    const handleCancel = () => {
        navigate('/tournaments');
    };

    // Show loading state while fetching initial data
    if (fetchingData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography variant="body1">Loading tournament data...</Typography>
                </Box>
            </Box>
        );
    }

    // Show error state if initial data fetch failed
    if (fetchError && !courses.length && !players.length && !teams.length) {
        return (
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={handleCancel}
                        sx={{ mr: 2 }}
                    >
                        Back to Tournaments
                    </Button>
                    <Typography variant="h4" component="h1">
                        Create Tournament
                    </Typography>
                </Box>

                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {fetchError}
                    </Alert>
                    <Button variant="contained" onClick={() => window.location.reload()}>
                        Retry
                    </Button>
                </Paper>
            </Box>
        );
    }

    // Render step content based on active step
    const getStepContent = (step) => {
        switch (step) {
            case 0: // Basic Information
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                label="Tournament Name"
                                name="name"
                                value={tournamentData.name}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                name="description"
                                value={tournamentData.description}
                                onChange={handleInputChange}
                                multiline
                                rows={3}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="Start Date"
                                name="start_date"
                                type="date"
                                value={tournamentData.start_date}
                                onChange={handleInputChange}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="Number of Days"
                                name="number_of_days"
                                type="number"
                                value={tournamentData.number_of_days}
                                onChange={handleInputChange}
                                InputProps={{ inputProps: { min: 1, max: 7 } }}
                                helperText={`Tournament will end on ${formatDate(tournamentData.end_date, 'MMMM d, yyyy')}`}
                            />
                        </Grid>
                    </Grid>
                );

            case 1: // Format & Scoring
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <FormLabel>Tournament Format</FormLabel>
                                <RadioGroup
                                    name="format"
                                    value={tournamentData.format}
                                    onChange={handleInputChange}
                                >
                                    <FormControlLabel
                                        value="stroke_play"
                                        control={<Radio />}
                                        label="Stroke Play"
                                    />
                                    <FormControlLabel
                                        value="match_play"
                                        control={<Radio />}
                                        label="Match Play"
                                    />
                                    <FormControlLabel
                                        value="stableford"
                                        control={<Radio />}
                                        label="Stableford"
                                    />
                                    <FormControlLabel
                                        value="four_ball"
                                        control={<Radio />}
                                        label="Four-Ball"
                                    />
                                </RadioGroup>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <FormLabel>Scoring Type</FormLabel>
                                <RadioGroup
                                    name="scoring_type"
                                    value={tournamentData.scoring_type}
                                    onChange={handleInputChange}
                                >
                                    <FormControlLabel
                                        value="gross"
                                        control={<Radio />}
                                        label="Gross Score Only"
                                    />
                                    <FormControlLabel
                                        value="net"
                                        control={<Radio />}
                                        label="Net Score Only"
                                    />
                                    <FormControlLabel
                                        value="both"
                                        control={<Radio />}
                                        label="Both Gross and Net"
                                    />
                                </RadioGroup>
                            </FormControl>

                            {tournamentData.scoring_type !== 'gross' && (
                                <TextField
                                    margin="normal"
                                    label="Handicap Allowance (%)"
                                    name="handicap_allowance"
                                    type="number"
                                    value={tournamentData.handicap_allowance}
                                    onChange={handleInputChange}
                                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                                    fullWidth
                                />
                            )}
                        </Grid>

                        {/* Updated Flight Management Section */}
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Flight Management
                            </Typography>

                            <FormControl component="fieldset">
                                <FormLabel component="legend">Flight Method</FormLabel>
                                <RadioGroup
                                    name="flight_method"
                                    value={tournamentData.flight_method}
                                    onChange={handleInputChange}
                                >
                                    <FormControlLabel
                                        value="none"
                                        control={<Radio />}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <GroupIcon sx={{ mr: 1 }} />
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        No Flights
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        All participants compete together
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        }
                                    />
                                    <FormControlLabel
                                        value="pre_handicap"
                                        control={<Radio />}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <FlightIcon sx={{ mr: 1 }} />
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        Pre-Flight by Handicap
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Create flights based on existing handicaps before tournament starts
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        }
                                    />
                                    <FormControlLabel
                                        value="post_scores"
                                        control={<Radio />}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <TimerIcon sx={{ mr: 1 }} />
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        Create Flights After First Round
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Create flights based on scores from the first round
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        }
                                    />
                                </RadioGroup>
                            </FormControl>

                            {/* Pre-Handicap Flight Configuration */}
                            {tournamentData.flight_method === 'pre_handicap' && (
                                <Box sx={{ mt: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="subtitle1">
                                            Configure Handicap-Based Flights ({preFlights.length})
                                        </Typography>
                                        <Button
                                            startIcon={<AddIcon />}
                                            onClick={addPreFlight}
                                            disabled={preFlights.length >= 6}
                                            size="small"
                                            variant="outlined"
                                        >
                                            Add Flight
                                        </Button>
                                    </Box>

                                    {preFlights.map((flight, index) => (
                                        <Paper key={index} sx={{ p: 2, mb: 2, backgroundColor: 'background.paper' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="subtitle2">
                                                    Flight {index + 1}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => removePreFlight(index)}
                                                    disabled={preFlights.length <= 1}
                                                >
                                                    <RemoveIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                                <Grid item xs={12} sm={4}>
                                                    <TextField
                                                        fullWidth
                                                        label="Flight Name"
                                                        value={flight.name}
                                                        onChange={(e) => handlePreFlightChange(index, 'name', e.target.value)}
                                                        size="small"
                                                    />
                                                </Grid>
                                                <Grid item xs={6} sm={4}>
                                                    <TextField
                                                        fullWidth
                                                        label="Min Handicap"
                                                        type="number"
                                                        value={flight.min_handicap}
                                                        onChange={(e) => handlePreFlightChange(index, 'min_handicap', parseInt(e.target.value, 10))}
                                                        size="small"
                                                        InputProps={{ inputProps: { min: 0, max: 36 } }}
                                                    />
                                                </Grid>
                                                <Grid item xs={6} sm={4}>
                                                    <TextField
                                                        fullWidth
                                                        label="Max Handicap"
                                                        type="number"
                                                        value={flight.max_handicap}
                                                        onChange={(e) => handlePreFlightChange(index, 'max_handicap', parseInt(e.target.value, 10))}
                                                        size="small"
                                                        InputProps={{ inputProps: { min: 0, max: 36 } }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    ))}
                                </Box>
                            )}

                            {/* Post-Scores Flight Configuration */}
                            {tournamentData.flight_method === 'post_scores' && (
                                <Box sx={{ mt: 3 }}>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Flights will be created after the first round
                                        </Typography>
                                        <Typography variant="body2">
                                            Participants will be automatically divided into flights based on their first-round scores.
                                            You can manually adjust flights before subsequent rounds.
                                        </Typography>
                                    </Alert>

                                    <TextField
                                        label="Target Flight Size"
                                        name="auto_flight_size"
                                        type="number"
                                        value={tournamentData.auto_flight_size}
                                        onChange={handleInputChange}
                                        InputProps={{ inputProps: { min: 8, max: 24 } }}
                                        helperText="Approximate number of players per flight (system will adjust based on total participants)"
                                        sx={{ maxWidth: 300 }}
                                    />
                                </Box>
                            )}
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <FormControl component="fieldset">
                                <FormLabel component="legend">Participant Type</FormLabel>
                                <RadioGroup
                                    name="participant_type"
                                    value={tournamentData.participant_type}
                                    onChange={handleInputChange}
                                    row
                                >
                                    <FormControlLabel
                                        value="individual"
                                        control={<Radio />}
                                        label="Individual Players"
                                    />
                                    <FormControlLabel
                                        value="team"
                                        control={<Radio />}
                                        label="Teams Only"
                                    />
                                    <FormControlLabel
                                        value="mixed"
                                        control={<Radio />}
                                        label="Mixed (Both Individual & Team)"
                                    />
                                </RadioGroup>
                            </FormControl>

                            {tournamentData.participant_type !== 'individual' && (
                                <TextField
                                    margin="normal"
                                    label="Team Size"
                                    name="team_size"
                                    type="number"
                                    value={tournamentData.team_size}
                                    onChange={handleInputChange}
                                    InputProps={{ inputProps: { min: 2, max: 4 } }}
                                    helperText="Number of players per team (2-4)"
                                    fullWidth
                                />
                            )}
                        </Grid>
                    </Grid>
                );

            case 2: // Courses & Schedule
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel id="courses-select-label">Select Courses</InputLabel>
                                <Select
                                    labelId="courses-select-label"
                                    multiple
                                    value={tournamentData.courses}
                                    onChange={handleCourseSelection}
                                    label="Select Courses"
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((courseId) => {
                                                const course = courses.find(c => c.id === courseId);
                                                return course ? (
                                                    <Chip
                                                        key={courseId}
                                                        label={course.name}
                                                        size="small"
                                                    />
                                                ) : null;
                                            })}
                                        </Box>
                                    )}
                                >
                                    {courses.map((course) => (
                                        <MenuItem key={course.id} value={course.id}>
                                            {course.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {tournamentData.courses.length > 0 && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                                    Selected Courses
                                </Typography>
                                <TableContainer component={Paper}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Course Name</TableCell>
                                                <TableCell>Par</TableCell>
                                                <TableCell>Holes</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {tournamentData.courses.map((courseId) => {
                                                const course = courses.find(c => c.id === courseId);
                                                return course ? (
                                                    <TableRow key={courseId}>
                                                        <TableCell>{course.name}</TableCell>
                                                        <TableCell>{course.par || 'N/A'}</TableCell>
                                                        <TableCell>{course.holes?.length || 0}</TableCell>
                                                    </TableRow>
                                                ) : null;
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        )}

                        {tournamentData.number_of_days > 1 && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                                    Tournament Schedule
                                </Typography>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    You'll be able to assign specific courses to each day after creating the tournament.
                                </Alert>
                                <TableContainer component={Paper}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Day</TableCell>
                                                <TableCell>Date</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {Array.from({ length: tournamentData.number_of_days }).map((_, index) => {
                                                const date = addDays(new Date(tournamentData.start_date), index);
                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell>Day {index + 1}</TableCell>
                                                        <TableCell>{format(date, 'EEEE, MMMM d, yyyy')}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        )}
                    </Grid>
                );

            case 3: // Participants
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Participants are optional
                                </Typography>
                                <Typography variant="body2">
                                    You can create the tournament now and add participants later through the tournament management page.
                                </Typography>
                            </Alert>

                            {tournamentData.participant_type !== 'team' && (
                                <>
                                    <Typography variant="h6" gutterBottom>Individual Participants (Optional)</Typography>
                                    <FormControl fullWidth>
                                        <InputLabel id="participants-select-label">Select Players</InputLabel>
                                        <Select
                                            labelId="participants-select-label"
                                            multiple
                                            value={tournamentData.individual_participants}
                                            onChange={handleIndividualParticipantSelection}
                                            label="Select Players"
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((playerId) => {
                                                        const player = players.find(p => p.id === playerId);
                                                        return player ? (
                                                            <Chip
                                                                key={playerId}
                                                                label={`${player.first_name} ${player.last_name}`}
                                                                size="small"
                                                            />
                                                        ) : null;
                                                    })}
                                                </Box>
                                            )}
                                        >
                                            {players.map((player) => (
                                                <MenuItem key={player.id} value={player.id}>
                                                    {player.first_name} {player.last_name}
                                                    {player.handicap !== null && ` (HCP: ${player.handicap})`}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </>
                            )}

                            {tournamentData.participant_type !== 'individual' && (
                                <Grid item xs={12} sx={{ mt: tournamentData.participant_type === 'mixed' ? 3 : 0 }}>
                                    <Typography variant="h6" gutterBottom>Teams (Optional)</Typography>
                                    <FormControl fullWidth>
                                        <InputLabel id="teams-select-label">Select Teams</InputLabel>
                                        <Select
                                            labelId="teams-select-label"
                                            multiple
                                            value={tournamentData.teams}
                                            onChange={handleTeamSelection}
                                            label="Select Teams"
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((teamId) => {
                                                        const team = teams.find(t => t.id === teamId);
                                                        return team ? (
                                                            <Chip
                                                                key={teamId}
                                                                label={team.name}
                                                                size="small"
                                                            />
                                                        ) : null;
                                                    })}
                                                </Box>
                                            )}
                                        >
                                            {teams.map((team) => (
                                                <MenuItem key={team.id} value={team.id}>
                                                    {team.name} ({team.members?.length || 0} members)
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    {tournamentData.teams.length > 0 && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Selected Teams ({tournamentData.teams.length})
                                            </Typography>
                                            <Grid container spacing={1}>
                                                {tournamentData.teams.map((teamId) => {
                                                    const team = teams.find(t => t.id === teamId);
                                                    return team ? (
                                                        <Grid item xs={12} sm={6} md={4} key={teamId}>
                                                            <Paper sx={{ p: 2 }}>
                                                                <Typography variant="subtitle2" gutterBottom>
                                                                    {team.name}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Members: {team.members?.length || 0}
                                                                </Typography>
                                                                {team.members && team.members.length > 0 && (
                                                                    <Box sx={{ mt: 1 }}>
                                                                        {team.members.map(member => (
                                                                            <Chip
                                                                                key={member.id}
                                                                                label={`${member.first_name} ${member.last_name}`}
                                                                                size="small"
                                                                                sx={{ mr: 0.5, mb: 0.5 }}
                                                                            />
                                                                        ))}
                                                                    </Box>
                                                                )}
                                                            </Paper>
                                                        </Grid>
                                                    ) : null;
                                                })}
                                            </Grid>
                                        </Box>
                                    )}
                                </Grid>
                            )}

                            {/* Show message when no participants are selected */}
                            {tournamentData.individual_participants.length === 0 &&
                                tournamentData.teams.length === 0 && (
                                    <Paper sx={{ p: 3, mt: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                                        <GroupIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                        <Typography variant="body1" color="text.secondary" paragraph>
                                            No participants selected yet
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            You can proceed to create the tournament and add participants later.
                                        </Typography>
                                    </Paper>
                                )}
                        </Grid>
                    </Grid>
                );

            case 4: // Review & Create
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                Please review your tournament details before creating it.
                            </Alert>

                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Basic Information
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2">Tournament Name</Typography>
                                        <Typography variant="body1" gutterBottom>{tournamentData.name}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2">Dates</Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {formatDate(tournamentData.start_date, 'MMMM d, yyyy')}
                                            {tournamentData.start_date !== tournamentData.end_date &&
                                                ` - ${formatDate(tournamentData.end_date, 'MMMM d, yyyy')}`}
                                            {` (${tournamentData.number_of_days} day${tournamentData.number_of_days > 1 ? 's' : ''})`}
                                        </Typography>
                                    </Grid>
                                    {tournamentData.description && (
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2">Description</Typography>
                                            <Typography variant="body1" gutterBottom>{tournamentData.description}</Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </Paper>

                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Format & Scoring
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2">Tournament Format</Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {tournamentData.format === 'stroke_play' && 'Stroke Play'}
                                            {tournamentData.format === 'match_play' && 'Match Play'}
                                            {tournamentData.format === 'stableford' && 'Stableford'}
                                            {tournamentData.format === 'four_ball' && 'Four-Ball'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2">Scoring Type</Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {tournamentData.scoring_type === 'gross' && 'Gross Score Only'}
                                            {tournamentData.scoring_type === 'net' && 'Net Score Only'}
                                            {tournamentData.scoring_type === 'both' && 'Both Gross and Net'}
                                            {tournamentData.scoring_type !== 'gross' && ` (${tournamentData.handicap_allowance}% handicap allowance)`}
                                        </Typography>
                                    </Grid>

                                    {/* Flight Method Review */}
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2">Flight Method</Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {tournamentData.flight_method === 'none' && 'No flights - all participants compete together'}
                                            {tournamentData.flight_method === 'pre_handicap' && `Pre-flight by handicap (${preFlights.length} flights configured)`}
                                            {tournamentData.flight_method === 'post_scores' && `Flights will be created after first round (target size: ${tournamentData.auto_flight_size} players)`}
                                        </Typography>

                                        {tournamentData.flight_method === 'pre_handicap' && (
                                            <Grid container spacing={1} sx={{ mt: 1 }}>
                                                {preFlights.map((flight, index) => (
                                                    <Grid item xs={6} sm={4} md={3} key={index}>
                                                        <Chip
                                                            label={`${flight.name} (${flight.min_handicap}-${flight.max_handicap})`}
                                                            size="small"
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        )}
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2">Participant Type</Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {tournamentData.participant_type === 'individual' && 'Individual Players Only'}
                                            {tournamentData.participant_type === 'team' && `Teams Only (${tournamentData.team_size} players per team)`}
                                            {tournamentData.participant_type === 'mixed' && `Mixed: Individual & Teams (${tournamentData.team_size} players per team)`}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>

                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Courses & Participants
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2">Courses</Typography>
                                        {tournamentData.courses.length > 0 ? (
                                            <Typography variant="body1" gutterBottom>
                                                {tournamentData.courses.map(courseId => {
                                                    const course = courses.find(c => c.id === courseId);
                                                    return course ? course.name : '';
                                                }).join(', ')}
                                            </Typography>
                                        ) : (
                                            <Typography variant="body1" color="error" gutterBottom>
                                                No courses selected
                                            </Typography>
                                        )}
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2">Participants</Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {(() => {
                                                const individualCount = tournamentData.individual_participants?.length || 0;
                                                const teamCount = tournamentData.teams?.length || 0;

                                                if (individualCount === 0 && teamCount === 0) {
                                                    return "No participants selected (can be added later)";
                                                }

                                                if (tournamentData.participant_type === 'individual') {
                                                    return `${individualCount} players selected`;
                                                } else if (tournamentData.participant_type === 'team') {
                                                    return `${teamCount} teams selected`;
                                                } else {
                                                    return `${individualCount} players and ${teamCount} teams selected`;
                                                }
                                            })()}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>

                            {(tournamentData.name === '' ||
                                tournamentData.courses.length === 0) && (
                                    <Alert severity="warning">
                                        Please complete all required fields before creating the tournament.
                                        <br />
                                        <strong>Required:</strong> Tournament name and at least one course.
                                        <br />
                                        <strong>Optional:</strong> Participants (can be added after tournament creation).
                                    </Alert>
                                )}

                            {fetchError && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {fetchError}
                                </Alert>
                            )}

                        </Grid>
                    </Grid>
                );

            default:
                return 'Unknown step';
        }
    };

    // Check if the current step is complete
    const isStepComplete = (step) => {
        switch (step) {
            case 0:
                return tournamentData.name !== '';
            case 1:
                return true; // Format step is always complete
            case 2:
                return tournamentData.courses && tournamentData.courses.length > 0;
            case 3:
                // Participants step is now always complete (participants are optional)
                return true;
            case 4:
                // Final step only requires name and courses (participants are optional)
                return tournamentData.name !== '' &&
                    tournamentData.courses && tournamentData.courses.length > 0;
            default:
                return false;
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={handleCancel}
                    sx={{ mr: 2 }}
                >
                    Cancel
                </Button>
                <Typography variant="h4" component="h1">
                    Create Tournament
                </Typography>
            </Box>

            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                    {steps.map((label, index) => (
                        <Step key={label} completed={isStepComplete(index) && index < activeStep}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box sx={{ mt: 2, mb: 2 }}>
                    {getStepContent(activeStep)}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                    >
                        Back
                    </Button>
                    <Box>
                        {activeStep === steps.length - 1 ? (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleCreateTournament}
                                disabled={!isStepComplete(activeStep) || loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <TrophyIcon />}
                            >
                                Create Tournament
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                disabled={!isStepComplete(activeStep)}
                            >
                                Next
                            </Button>
                        )}
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}

export default TournamentCreationWizard;
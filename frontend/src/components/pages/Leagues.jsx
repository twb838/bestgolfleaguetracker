import React, { useState, useEffect } from 'react';
import {
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Paper,
    Box,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    OutlinedInput,
    Checkbox,
    ListItemIcon,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    SportsSoccer as TeamIcon,
    GolfCourse as CourseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { get, post, put, del } from '../../services/api'; // Import API service

function Leagues() {
    const navigate = useNavigate();
    const [leagues, setLeagues] = useState([]);
    const [teams, setTeams] = useState([]);
    const [courses, setCourses] = useState([]);

    // Create league state
    const [open, setOpen] = useState(false);
    const [newLeague, setNewLeague] = useState({
        name: '',
        description: '',
        teams: [],
        courses: []
    });
    const [formError, setFormError] = useState('');

    // Edit league state
    const [editOpen, setEditOpen] = useState(false);
    const [editLeague, setEditLeague] = useState({
        id: null,
        name: '',
        description: '',
        teams: [],
        courses: []
    });
    const [editError, setEditError] = useState('');

    // Delete league state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [leagueToDelete, setLeagueToDelete] = useState(null);

    useEffect(() => {
        fetchLeagues();
        fetchTeams();
        fetchCourses();
    }, []);

    // Update fetchLeagues to use API service
    const fetchLeagues = async () => {
        try {
            console.log('Fetching leagues...');
            const data = await get('/leagues');
            setLeagues(data);
        } catch (error) {
            console.error('Error fetching leagues:', error);
        }
    };

    // Update fetchTeams to use API service
    const fetchTeams = async () => {
        try {
            console.log('Fetching teams...');
            const data = await get('/teams');
            setTeams(data);
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    // Update fetchCourses to use API service
    const fetchCourses = async () => {
        try {
            console.log('Fetching courses...');
            const data = await get('/courses');
            setCourses(data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    // CREATE FUNCTIONALITY

    const validateForm = () => {
        setFormError('');

        if (!newLeague.name.trim()) {
            setFormError('League name is required');
            return false;
        }

        if (newLeague.teams.length === 0) {
            setFormError('At least one team is required');
            return false;
        }

        if (newLeague.courses.length === 0) {
            setFormError('At least one course is required');
            return false;
        }

        return true;
    };

    // Update handleAddLeague to use API service
    const handleAddLeague = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            // Prepare the league data with team and course IDs
            const leagueToSubmit = {
                name: newLeague.name,
                description: newLeague.description,
                team_ids: newLeague.teams.map(teamId => teamId),
                course_ids: newLeague.courses.map(courseId => courseId)
            };

            await post('/leagues', leagueToSubmit);

            setOpen(false);
            setNewLeague({
                name: '',
                description: '',
                teams: [],
                courses: []
            });
            setFormError('');
            fetchLeagues();
        } catch (error) {
            console.error('Error adding league:', error);
            setFormError(error.message || 'Error creating league');
        }
    };

    const handleTeamSelection = (teamId) => {
        const currentTeams = [...newLeague.teams];
        const teamIndex = currentTeams.indexOf(teamId);

        if (teamIndex === -1) {
            // Add the team
            currentTeams.push(teamId);
        } else {
            // Remove the team
            currentTeams.splice(teamIndex, 1);
        }

        setNewLeague({
            ...newLeague,
            teams: currentTeams
        });
    };

    const handleCourseSelection = (courseId) => {
        const currentCourses = [...newLeague.courses];
        const courseIndex = currentCourses.indexOf(courseId);

        if (courseIndex === -1) {
            // Add the course
            currentCourses.push(courseId);
        } else {
            // Remove the course
            currentCourses.splice(courseIndex, 1);
        }

        setNewLeague({
            ...newLeague,
            courses: currentCourses
        });
    };

    // Add this function to handle selecting all teams
    const handleSelectAllTeams = () => {
        // Get all team IDs
        const allTeamIds = teams.map(team => team.id);

        // Update the newLeague state with all team IDs
        setNewLeague({
            ...newLeague,
            teams: allTeamIds
        });
    };

    // Add this function to handle deselecting all teams
    const handleDeselectAllTeams = () => {
        setNewLeague({
            ...newLeague,
            teams: []
        });
    };

    // Add functions to handle selecting/deselecting all courses
    const handleSelectAllCourses = () => {
        const allCourseIds = courses.map(course => course.id);
        setNewLeague({
            ...newLeague,
            courses: allCourseIds
        });
    };

    const handleDeselectAllCourses = () => {
        setNewLeague({
            ...newLeague,
            courses: []
        });
    };

    // EDIT FUNCTIONALITY

    const handleEditLeague = (league) => {
        // Transform the league object to the format needed for editing
        setEditLeague({
            id: league.id,
            name: league.name,
            description: league.description || '',
            teams: league.teams ? league.teams.map(team => team.id) : [],
            courses: league.courses ? league.courses.map(course => course.id) : []
        });
        setEditOpen(true);
        setEditError('');
    };

    const handleEditTeamSelection = (teamId) => {
        const currentTeams = [...editLeague.teams];
        const teamIndex = currentTeams.indexOf(teamId);

        if (teamIndex === -1) {
            // Add the team
            currentTeams.push(teamId);
        } else {
            // Remove the team
            currentTeams.splice(teamIndex, 1);
        }

        setEditLeague({
            ...editLeague,
            teams: currentTeams
        });
    };

    const handleEditCourseSelection = (courseId) => {
        const currentCourses = [...editLeague.courses];
        const courseIndex = currentCourses.indexOf(courseId);

        if (courseIndex === -1) {
            // Add the course
            currentCourses.push(courseId);
        } else {
            // Remove the course
            currentCourses.splice(courseIndex, 1);
        }

        setEditLeague({
            ...editLeague,
            courses: currentCourses
        });
    };

    const validateEditForm = () => {
        setEditError('');

        if (!editLeague.name.trim()) {
            setEditError('League name is required');
            return false;
        }

        if (editLeague.teams.length === 0) {
            setEditError('At least one team is required');
            return false;
        }

        if (editLeague.courses.length === 0) {
            setEditError('At least one course is required');
            return false;
        }

        return true;
    };

    // Update handleEditSubmit to use API service
    const handleEditSubmit = async () => {
        if (!validateEditForm()) {
            return;
        }

        try {
            // Prepare the league data with team and course IDs
            const leagueToSubmit = {
                name: editLeague.name,
                description: editLeague.description,
                team_ids: editLeague.teams,
                course_ids: editLeague.courses
            };

            await put(`/leagues/${editLeague.id}`, leagueToSubmit);

            setEditOpen(false);
            setEditLeague({
                id: null,
                name: '',
                description: '',
                teams: [],
                courses: []
            });
            setEditError('');
            fetchLeagues();
        } catch (error) {
            console.error('Error updating league:', error);
            setEditError(error.message || 'Error updating league');
        }
    };

    // DELETE FUNCTIONALITY

    const handleConfirmDeleteClick = (league) => {
        setLeagueToDelete(league);
        setDeleteDialogOpen(true);
    };

    // Update handleDeleteLeague to use API service
    const handleDeleteLeague = async () => {
        if (!leagueToDelete) return;

        try {
            await del(`/leagues/${leagueToDelete.id}`);

            setDeleteDialogOpen(false);
            setLeagueToDelete(null);
            fetchLeagues();
        } catch (error) {
            console.error('Error deleting league:', error);
        }
    };

    const handleLeagueClick = (league) => {
        navigate(`/leagues/${league.id}`, { state: { league } });
    };

    return (
        <div>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    Leagues
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpen(true)}
                >
                    Create League
                </Button>
            </Box>

            <Paper>
                {leagues.length > 0 ? (
                    <List>
                        {leagues.map((league) => (
                            <ListItem
                                key={league.id}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Typography
                                            variant="h6"
                                            color="primary"
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': { textDecoration: 'underline' }
                                            }}
                                            onClick={() => handleLeagueClick(league)}
                                        >
                                            {league.name}
                                        </Typography>
                                    }
                                    secondary={
                                        <>
                                            {league.description}
                                            <Box sx={{ mt: 1 }}>
                                                <Chip
                                                    icon={<TeamIcon />}
                                                    label={`${league.teams?.length || 0} Teams`}
                                                    size="small"
                                                    sx={{ mr: 1 }}
                                                />
                                                <Chip
                                                    icon={<CourseIcon />}
                                                    label={`${league.courses?.length || 0} Courses`}
                                                    size="small"
                                                />
                                            </Box>
                                        </>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        aria-label="edit"
                                        sx={{ mr: 1 }}
                                        onClick={() => handleEditLeague(league)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={() => handleConfirmDeleteClick(league)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        p={4}
                        textAlign="center"
                    >
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                            No Leagues Created
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                            Create your first league by clicking the "Create League" button above.
                        </Typography>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => setOpen(true)}
                            sx={{ mt: 3 }}
                            startIcon={<AddIcon />}
                        >
                            Create League
                        </Button>
                    </Box>
                )}
            </Paper>

            {/* Create League Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Create New League</DialogTitle>
                <DialogContent>
                    {formError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {formError}
                        </Alert>
                    )}

                    <TextField
                        autoFocus
                        margin="dense"
                        label="League Name"
                        fullWidth
                        value={newLeague.name}
                        onChange={(e) => setNewLeague({ ...newLeague, name: e.target.value })}
                        sx={{ mb: 2 }}
                        required
                    />

                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        value={newLeague.description}
                        onChange={(e) => setNewLeague({ ...newLeague, description: e.target.value })}
                        sx={{ mb: 3 }}
                    />

                    {/* Teams Selection */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">
                            Teams
                        </Typography>
                        <Box>
                            <Button
                                size="small"
                                onClick={handleSelectAllTeams}
                                disabled={teams.length === 0}
                                sx={{ mr: 1 }}
                            >
                                Select All
                            </Button>
                            <Button
                                size="small"
                                onClick={handleDeselectAllTeams}
                                disabled={newLeague.teams.length === 0}
                            >
                                Deselect All
                            </Button>
                        </Box>
                    </Box>

                    {teams.length > 0 ? (
                        <Paper variant="outlined" sx={{ mb: 3, maxHeight: 200, overflow: 'auto' }}>
                            <List dense>
                                {teams.map((team) => (
                                    <ListItem key={team.id} button onClick={() => handleTeamSelection(team.id)}>
                                        <ListItemIcon>
                                            <Checkbox
                                                edge="start"
                                                checked={newLeague.teams.includes(team.id)}
                                                tabIndex={-1}
                                                disableRipple
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={team.name}
                                            secondary={`${team.players?.length || 0} players`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    ) : (
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            No teams available. Please create teams first.
                        </Alert>
                    )}

                    {/* Courses Selection */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">
                            Courses
                        </Typography>
                        <Box>
                            <Button
                                size="small"
                                onClick={handleSelectAllCourses}
                                disabled={courses.length === 0}
                                sx={{ mr: 1 }}
                            >
                                Select All
                            </Button>
                            <Button
                                size="small"
                                onClick={handleDeselectAllCourses}
                                disabled={newLeague.courses.length === 0}
                            >
                                Deselect All
                            </Button>
                        </Box>
                    </Box>

                    {courses.length > 0 ? (
                        <Paper variant="outlined" sx={{ mb: 2, maxHeight: 200, overflow: 'auto' }}>
                            <List dense>
                                {courses.map((course) => (
                                    <ListItem key={course.id} button onClick={() => handleCourseSelection(course.id)}>
                                        <ListItemIcon>
                                            <Checkbox
                                                edge="start"
                                                checked={newLeague.courses.includes(course.id)}
                                                tabIndex={-1}
                                                disableRipple
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={course.name}
                                            secondary={`${course.holes?.length || 0} holes`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    ) : (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            No courses available. Please create courses first.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleAddLeague}
                        color="primary"
                        variant="contained"
                        disabled={!newLeague.name || newLeague.teams.length === 0 || newLeague.courses.length === 0}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit League Dialog */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Edit League</DialogTitle>
                <DialogContent>
                    {editError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {editError}
                        </Alert>
                    )}

                    <TextField
                        autoFocus
                        margin="dense"
                        label="League Name"
                        fullWidth
                        value={editLeague.name}
                        onChange={(e) => setEditLeague({ ...editLeague, name: e.target.value })}
                        sx={{ mb: 2 }}
                        required
                    />

                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        value={editLeague.description}
                        onChange={(e) => setEditLeague({ ...editLeague, description: e.target.value })}
                        sx={{ mb: 3 }}
                    />

                    {/* Teams Selection */}
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Teams
                    </Typography>

                    {teams.length > 0 ? (
                        <Paper variant="outlined" sx={{ mb: 3, maxHeight: 200, overflow: 'auto' }}>
                            <List dense>
                                {teams.map((team) => (
                                    <ListItem key={team.id} button onClick={() => handleEditTeamSelection(team.id)}>
                                        <ListItemIcon>
                                            <Checkbox
                                                edge="start"
                                                checked={editLeague.teams.includes(team.id)}
                                                tabIndex={-1}
                                                disableRipple
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={team.name}
                                            secondary={`${team.players?.length || 0} players`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    ) : (
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            No teams available. Please create teams first.
                        </Alert>
                    )}

                    {/* Courses Selection */}
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Courses
                    </Typography>

                    {courses.length > 0 ? (
                        <Paper variant="outlined" sx={{ mb: 2, maxHeight: 200, overflow: 'auto' }}>
                            <List dense>
                                {courses.map((course) => (
                                    <ListItem key={course.id} button onClick={() => handleEditCourseSelection(course.id)}>
                                        <ListItemIcon>
                                            <Checkbox
                                                edge="start"
                                                checked={editLeague.courses.includes(course.id)}
                                                tabIndex={-1}
                                                disableRipple
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={course.name}
                                            secondary={`${course.holes?.length || 0} holes`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    ) : (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            No courses available. Please create courses first.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleEditSubmit}
                        color="primary"
                        variant="contained"
                        disabled={!editLeague.name || editLeague.teams.length === 0 || editLeague.courses.length === 0}
                    >
                        Update
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Delete League</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the league "{leagueToDelete?.name}"?
                    </Typography>
                    <Typography color="error" sx={{ mt: 2 }}>
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleDeleteLeague}
                        color="error"
                        variant="contained"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default Leagues;
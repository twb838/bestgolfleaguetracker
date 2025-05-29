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
    Paper,
    IconButton,
    Box,
    Divider,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import {
    Add as AddIcon,
    Remove as RemoveIcon,
    Delete as DeleteIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { get, post, put, del } from '../../services/api'; // Import API service

function Courses() {
    const [courses, setCourses] = useState([]);
    const [open, setOpen] = useState(false);
    const [newCourse, setNewCourse] = useState({
        name: '',
        holes: Array(18).fill().map((_, i) => ({
            number: i + 1,
            par: 4,
            yards: '',
            handicap: i + 1
        }))
    });
    const [formError, setFormError] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState('');
    const [editOpen, setEditOpen] = useState(false);
    const [editCourse, setEditCourse] = useState(null);
    const [editError, setEditError] = useState('');
    const [deletedHoleIds, setDeletedHoleIds] = useState([]);

    useEffect(() => {
        fetchCourses();
    }, []);

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

    const handleHoleChange = (index, field, value) => {
        const updatedHoles = newCourse.holes.map((hole, i) => {
            if (i === index) {
                // For number fields, ensure proper conversion and handling of empty values
                if (['number', 'par', 'handicap', 'yards'].includes(field)) {
                    // Convert to number or use 0 for empty strings (except yards which can be null)
                    const numValue = value === '' ? (field === 'yards' ? '' : field === 'handicap' ? 1 : 4) : Number(value);
                    return { ...hole, [field]: numValue };
                }
                return { ...hole, [field]: value };
            }
            return hole;
        });
        setNewCourse({ ...newCourse, holes: updatedHoles });

        // Log the change for debugging
        if (field === 'handicap') {
            console.log(`New course - Updated handicap for hole ${index + 1} to:`, value,
                typeof value, '→ Stored as:', updatedHoles[index].handicap,
                typeof updatedHoles[index].handicap);
        }
    };

    const addHole = () => {
        const holeNumbers = newCourse.holes.map(h => h.number);
        let nextHoleNumber = 1;
        while (holeNumbers.includes(nextHoleNumber) && nextHoleNumber <= 18) {
            nextHoleNumber++;
        }

        if (nextHoleNumber > 18) {
            setFormError('Maximum of 18 holes allowed');
            return;
        }

        const handicaps = newCourse.holes.map(h => h.handicap);
        let nextHandicap = 1;
        while (handicaps.includes(nextHandicap) && nextHandicap <= 18) {
            nextHandicap++;
        }

        const newHole = {
            number: nextHoleNumber,
            par: 4,
            yards: '',
            handicap: nextHandicap
        };

        setNewCourse({
            ...newCourse,
            holes: [...newCourse.holes, newHole]
        });
    };

    const removeHole = (index) => {
        if (newCourse.holes.length <= 1) {
            setFormError('Course must have at least one hole');
            return;
        }

        const updatedHoles = newCourse.holes.filter((_, i) => i !== index);
        setNewCourse({
            ...newCourse,
            holes: updatedHoles
        });

        setFormError('');
    };

    const validateCourse = () => {
        if (!newCourse.name.trim()) {
            setFormError('Course name is required');
            return false;
        }

        for (let i = 0; i < newCourse.holes.length; i++) {
            const hole = newCourse.holes[i];
            if (!hole.number || hole.number < 1 || hole.number > 18) {
                setFormError(`Hole number must be between 1 and 18`);
                return false;
            }
            if (!hole.par || hole.par < 3 || hole.par > 5) {
                setFormError(`Par must be between 3 and 5 for hole ${hole.number}`);
                return false;
            }
            if (!hole.handicap || hole.handicap < 1 || hole.handicap > 18) {
                setFormError(`Handicap must be between 1 and 18 for hole ${hole.number}`);
                return false;
            }
        }

        setFormError('');
        return true;
    };

    // Update handleAddCourse to use API service
    const handleAddCourse = async () => {
        if (!validateCourse()) {
            return;
        }

        const courseToSubmit = {
            name: newCourse.name,
            holes: newCourse.holes.map(hole => ({
                number: Number(hole.number),
                par: Number(hole.par),
                handicap: Number(hole.handicap),
                yards: hole.yards ? Number(hole.yards) : null
            }))
        };

        try {
            await post('/courses', courseToSubmit);

            setOpen(false);
            setNewCourse({
                name: '',
                holes: Array(18).fill().map((_, i) => ({
                    number: i + 1,
                    par: 4,
                    yards: '',
                    handicap: i + 1
                }))
            });
            setFormError('');
            fetchCourses();
        } catch (error) {
            console.error('Error adding course:', error);
            setFormError(error.message || 'Error creating course');
        }
    };

    // Update handleDeleteCourse to use API service
    const handleDeleteCourse = async () => {
        try {
            await del(`/courses/${courseToDelete.id}`);

            setDeleteDialogOpen(false);
            setCourseToDelete(null);
            fetchCourses();
        } catch (error) {
            console.error('Error deleting course:', error);
            setDeleteError(error.message || 'Error deleting course');
        }
    };

    const handleEditCourse = (course) => {
        // Make a deep copy of the course and fix any invalid data
        const cleanedCourse = {
            id: course.id,
            name: course.name,
            holes: course.holes ? course.holes.map(hole => ({
                ...hole,
                // Ensure handicap is a valid number between 1-18
                handicap: (!hole.handicap || isNaN(hole.handicap)) ? 1 : Number(hole.handicap)
            })) : []
        };

        setEditCourse(cleanedCourse);
        setEditOpen(true);
        setEditError('');
        setDeletedHoleIds([]); // Reset the deleted holes array

        // Log for debugging
        console.log('Editing course:', cleanedCourse);
    };

    const handleEditHoleChange = (index, field, value) => {
        const updatedHoles = editCourse.holes.map((hole, i) => {
            if (i === index) {
                // Create a new hole object with the updated field
                let updatedHole = { ...hole };

                // Handle number fields
                if (['number', 'par', 'handicap', 'yards'].includes(field)) {
                    // Special handling for handicap to ensure it's never null
                    if (field === 'handicap') {
                        // If empty, use 1 as default
                        updatedHole.handicap = value === '' ? 1 : Number(value);
                    }
                    // Handle other numeric fields
                    else {
                        updatedHole[field] = value === '' ?
                            (field === 'yards' ? '' : field === 'par' ? 4 : 1) :
                            Number(value);
                    }
                } else {
                    updatedHole[field] = value;
                }

                return updatedHole;
            }
            return hole;
        });

        setEditCourse({ ...editCourse, holes: updatedHoles });

        // Debug logging for handicap changes
        if (field === 'handicap') {
            console.log(`Updated handicap for hole ${index + 1} to:`, value,
                typeof value, '→ Stored as:', updatedHoles[index].handicap,
                typeof updatedHoles[index].handicap);
        }
    };

    const addHoleToEdit = () => {
        const holeNumbers = editCourse.holes.map(h => h.number);
        let nextHoleNumber = 1;
        while (holeNumbers.includes(nextHoleNumber) && nextHoleNumber <= 18) {
            nextHoleNumber++;
        }

        if (nextHoleNumber > 18) {
            setEditError('Maximum of 18 holes allowed');
            return;
        }

        const handicaps = editCourse.holes.map(h => h.handicap);
        let nextHandicap = 1;
        while (handicaps.includes(nextHandicap) && nextHandicap <= 18) {
            nextHandicap++;
        }

        const newHole = {
            number: nextHoleNumber,
            par: 4,
            yards: '',
            handicap: nextHandicap
        };

        setEditCourse({
            ...editCourse,
            holes: [...editCourse.holes, newHole]
        });
    };

    const removeHoleFromEdit = (index) => {
        if (editCourse.holes.length <= 1) {
            setEditError('Course must have at least one hole');
            return;
        }

        const holeToRemove = editCourse.holes[index];

        // If the hole has an ID (exists in database), track it for deletion
        if (holeToRemove.id) {
            setDeletedHoleIds([...deletedHoleIds, holeToRemove.id]);
        }

        const updatedHoles = editCourse.holes.filter((_, i) => i !== index);
        setEditCourse({
            ...editCourse,
            holes: updatedHoles
        });

        setEditError('');
    };

    const validateEditCourse = () => {
        if (!editCourse.name.trim()) {
            setEditError('Course name is required');
            return false;
        }

        for (let i = 0; i < editCourse.holes.length; i++) {
            const hole = editCourse.holes[i];

            // For each field, first check if it exists, then validate its value
            if (!hole.number || isNaN(Number(hole.number)) || Number(hole.number) < 1 || Number(hole.number) > 18) {
                setEditError(`Hole number must be between 1 and 18`);
                return false;
            }

            if (!hole.par || isNaN(Number(hole.par)) || Number(hole.par) < 3 || Number(hole.par) > 5) {
                setEditError(`Par must be between 3 and 5 for hole ${hole.number}`);
                return false;
            }

            // For handicap, check if it's a valid number between 1-18
            const handicap = Number(hole.handicap);
            if (isNaN(handicap) || handicap < 1 || handicap > 18) {
                setEditError(`Handicap must be between 1 and 18 for hole ${hole.number}`);
                console.error(`Invalid handicap ${hole.handicap} for hole ${hole.number}`);
                return false;
            }
        }

        setEditError('');
        return true;
    };

    // Add this before your handleEditSubmit function
    const logCourseData = (prefix, course) => {
        console.log(`${prefix} Course Data:`, {
            name: course.name,
            holes: course.holes.map(h => ({
                id: h.id,
                number: h.number,
                par: h.par,
                handicap: h.handicap,
                yards: h.yards,
                typeof_handicap: typeof h.handicap
            }))
        });
    };

    // Update handleEditSubmit to use API service
    const handleEditSubmit = async () => {
        if (!validateEditCourse()) {
            return;
        }

        // Log the data before any processing
        logCourseData("Before processing", editCourse);

        try {
            // First, update the course and its holes
            const courseToSubmit = {
                name: editCourse.name,
                holes: editCourse.holes.map(hole => {
                    // Make a clean object without any undefined or null handicaps
                    const cleanHole = {
                        id: hole.id || undefined,
                        number: Number(hole.number),
                        par: Number(hole.par),
                        // Ensure handicap is explicitly converted to a valid number between 1-18
                        handicap: hole.handicap === null || hole.handicap === undefined || hole.handicap === ''
                            ? 1 // Default to 1 if missing
                            : Number(hole.handicap),
                        yards: hole.yards === null || hole.yards === undefined || hole.yards === ''
                            ? null
                            : Number(hole.yards)
                    };

                    // Verify the handicap is actually being set correctly
                    if (cleanHole.handicap === null || isNaN(cleanHole.handicap)) {
                        console.error(`Invalid handicap detected for hole ${hole.number}:`, hole.handicap);
                        cleanHole.handicap = 1; // Fallback default
                    }

                    return cleanHole;
                })
            };

            // Log what we're actually sending
            console.log('Submitting course update:', JSON.stringify(courseToSubmit, null, 2));

            // Use API service instead of direct fetch
            await put(`/courses/${editCourse.id}`, courseToSubmit);

            // Then, delete any holes that were removed
            if (deletedHoleIds.length > 0) {
                // Delete each hole individually using API service
                await Promise.all(deletedHoleIds.map(holeId =>
                    del(`/courses/holes/${holeId}`)
                ));
            }

            setEditOpen(false);
            setEditCourse(null);
            setEditError('');
            setDeletedHoleIds([]);
            fetchCourses();
        } catch (error) {
            console.error('Error updating course:', error);
            setEditError(error.message || 'Network error. Please try again.');
        }
    };

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Golf Courses
            </Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={() => setOpen(true)}
                sx={{ mb: 3 }}
            >
                Add New Course
            </Button>

            <Paper>
                {courses.length > 0 ? (
                    <List>
                        {courses.map((course) => (
                            <ListItem
                                key={course.id}
                                button
                                onClick={() => handleEditCourse(course)}
                            >
                                <ListItemText
                                    primary={course.name}
                                    secondary={`Holes: ${course.holes?.length || 0}`}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        color="primary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditCourse(course);
                                        }}
                                        sx={{ mr: 1 }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        color="error"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCourseToDelete(course);
                                            setDeleteDialogOpen(true);
                                        }}
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
                            No Courses Created
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                            Create your first course by clicking the "Add New Course" button above.
                        </Typography>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => setOpen(true)}
                            sx={{ mt: 3 }}
                        >
                            Create Course
                        </Button>
                    </Box>
                )}
            </Paper>

            {/* Add Course Dialog */}
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>Add New Course</DialogTitle>
                <DialogContent>
                    {formError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {formError}
                        </Alert>
                    )}

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Course Name"
                        fullWidth
                        value={newCourse.name}
                        onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                        sx={{ mb: 3 }}
                        required
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Course Holes</Typography>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={addHole}
                            disabled={newCourse.holes.length >= 18}
                        >
                            Add Hole
                        </Button>
                    </Box>

                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Hole #</TableCell>
                                    <TableCell>Par</TableCell>
                                    <TableCell>Yards</TableCell>
                                    <TableCell>Handicap</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {newCourse.holes.map((hole, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="number"
                                                inputProps={{ min: 1, max: 18 }}
                                                value={hole.number}
                                                onChange={(e) => handleHoleChange(index, 'number', parseInt(e.target.value) || '')}
                                                required
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="number"
                                                inputProps={{ min: 3, max: 5 }}
                                                value={hole.par}
                                                onChange={(e) => handleHoleChange(index, 'par', parseInt(e.target.value) || '')}
                                                required
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="number"
                                                inputProps={{ min: 0, max: 999 }}
                                                value={hole.yards}
                                                onChange={(e) => handleHoleChange(index, 'yards', parseInt(e.target.value) || '')}
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="number"
                                                inputProps={{ min: 1, max: 18 }}
                                                value={hole.handicap}
                                                onChange={(e) => handleHoleChange(index, 'handicap', parseInt(e.target.value) || '')}
                                                required
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                color="error"
                                                onClick={() => removeHole(index)}
                                                disabled={newCourse.holes.length <= 1}
                                                size="small"
                                            >
                                                <RemoveIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleAddCourse}
                        color="primary"
                        disabled={!newCourse.name}
                    >
                        Add Course
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Course Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Delete Course</DialogTitle>
                <DialogContent>
                    {deleteError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {deleteError}
                        </Alert>
                    )}
                    <Typography>
                        Are you sure you want to delete the course "{courseToDelete?.name}"?
                    </Typography>
                    <Typography color="error" sx={{ mt: 2 }}>
                        This will also delete all {courseToDelete?.holes?.length || 0} holes associated with this course.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleDeleteCourse}
                        color="error"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Course Dialog */}
            <Dialog
                open={editOpen}
                onClose={() => setEditOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>Edit Course</DialogTitle>
                <DialogContent>
                    {editError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {editError}
                        </Alert>
                    )}

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Course Name"
                        fullWidth
                        value={editCourse?.name || ''}
                        onChange={(e) => setEditCourse({ ...editCourse, name: e.target.value })}
                        sx={{ mb: 3 }}
                        required
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Course Holes</Typography>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={addHoleToEdit}
                            disabled={editCourse?.holes?.length >= 18}
                        >
                            Add Hole
                        </Button>
                    </Box>

                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Hole #</TableCell>
                                    <TableCell>Par</TableCell>
                                    <TableCell>Yards</TableCell>
                                    <TableCell>Handicap</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {editCourse?.holes?.map((hole, index) => (
                                    <TableRow key={hole.id || index}>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="number"
                                                inputProps={{ min: 1, max: 18 }}
                                                value={hole.number}
                                                onChange={(e) => handleEditHoleChange(index, 'number', parseInt(e.target.value) || '')}
                                                required
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="number"
                                                inputProps={{ min: 3, max: 5 }}
                                                value={hole.par}
                                                onChange={(e) => handleEditHoleChange(index, 'par', parseInt(e.target.value) || '')}
                                                required
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="number"
                                                inputProps={{ min: 0, max: 999 }}
                                                value={hole.yards}
                                                onChange={(e) => handleEditHoleChange(index, 'yards', parseInt(e.target.value) || '')}
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="number"
                                                inputProps={{
                                                    min: 1,
                                                    max: 18,
                                                    // Force a value of 1 if field is cleared
                                                    onBlur: (e) => {
                                                        if (e.target.value === '') {
                                                            handleEditHoleChange(index, 'handicap', 1);
                                                        }
                                                    }
                                                }}
                                                value={hole.handicap === null || hole.handicap === undefined ? 1 : hole.handicap}
                                                onChange={(e) => handleEditHoleChange(index, 'handicap', e.target.value === '' ? '' : parseInt(e.target.value))}
                                                required
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                color="error"
                                                onClick={() => removeHoleFromEdit(index)}
                                                disabled={editCourse.holes.length <= 1}
                                                size="small"
                                            >
                                                <RemoveIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleEditSubmit}
                        color="primary"
                        disabled={!editCourse?.name}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default Courses;
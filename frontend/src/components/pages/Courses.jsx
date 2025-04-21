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
import env from '../../config/env';

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

    const fetchCourses = async () => {
        try {
            const response = await fetch(env.API_ENDPOINTS.COURSES);
            const data = await response.json();
            setCourses(data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const handleHoleChange = (index, field, value) => {
        const updatedHoles = newCourse.holes.map((hole, i) => {
            if (i === index) {
                return { ...hole, [field]: value };
            }
            return hole;
        });
        setNewCourse({ ...newCourse, holes: updatedHoles });
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
            const response = await fetch(env.API_ENDPOINTS.COURSES, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(courseToSubmit),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server error:', errorData);
                setFormError(errorData.detail || 'Error creating course');
                return;
            }
            
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
            setFormError('Network error. Please try again.');
        }
    };

    const handleDeleteCourse = async () => {
        try {
            const response = await fetch(`${env.API_ENDPOINTS.COURSES}/${courseToDelete.id}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                setDeleteDialogOpen(false);
                setCourseToDelete(null);
                fetchCourses();
            } else {
                const errorData = await response.json();
                setDeleteError(errorData.detail || 'Error deleting course');
            }
        } catch (error) {
            console.error('Error deleting course:', error);
            setDeleteError('Network error. Please try again.');
        }
    };

    const handleEditCourse = (course) => {
        setEditCourse({
            id: course.id,
            name: course.name,
            holes: course.holes ? [...course.holes] : []
        });
        setEditOpen(true);
        setEditError('');
        setDeletedHoleIds([]); // Reset the deleted holes array
    };

    const handleEditHoleChange = (index, field, value) => {
        const updatedHoles = editCourse.holes.map((hole, i) => {
            if (i === index) {
                return { ...hole, [field]: value };
            }
            return hole;
        });
        setEditCourse({ ...editCourse, holes: updatedHoles });
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
            if (!hole.number || hole.number < 1 || hole.number > 18) {
                setEditError(`Hole number must be between 1 and 18`);
                return false;
            }
            if (!hole.par || hole.par < 3 || hole.par > 5) {
                setEditError(`Par must be between 3 and 5 for hole ${hole.number}`);
                return false;
            }
            if (!hole.handicap || hole.handicap < 1 || hole.handicap > 18) {
                setEditError(`Handicap must be between 1 and 18 for hole ${hole.number}`);
                return false;
            }
        }

        setEditError('');
        return true;
    };

    const handleEditSubmit = async () => {
        if (!validateEditCourse()) {
            return;
        }

        try {
            // First, update the course and its holes
            const courseToSubmit = {
                name: editCourse.name,
                holes: editCourse.holes.map(hole => ({
                    id: hole.id || undefined,
                    number: Number(hole.number),
                    par: Number(hole.par),
                    handicap: Number(hole.handicap),
                    yards: hole.yards ? Number(hole.yards) : null
                }))
            };
            
            const response = await fetch(`${env.API_ENDPOINTS.COURSES}/${editCourse.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(courseToSubmit),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                setEditError(errorData.detail || 'Error updating course');
                return;
            }
            
            // Then, delete any holes that were removed
            if (deletedHoleIds.length > 0) {
                // Delete each hole individually
                await Promise.all(deletedHoleIds.map(holeId => 
                    fetch(`${env.API_ENDPOINTS.COURSES}/holes/${holeId}`, {
                        method: 'DELETE',
                    })
                ));
            }
            
            setEditOpen(false);
            setEditCourse(null);
            setEditError('');
            setDeletedHoleIds([]);
            fetchCourses();
        } catch (error) {
            console.error('Error updating course:', error);
            setEditError('Network error. Please try again.');
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
                                                inputProps={{ min: 1, max: 18 }}
                                                value={hole.handicap}
                                                onChange={(e) => handleEditHoleChange(index, 'handicap', parseInt(e.target.value) || '')}
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
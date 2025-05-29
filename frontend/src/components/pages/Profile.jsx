import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Container,
    Alert,
    CircularProgress,
    Grid,
    Avatar
} from '@mui/material';

const Profile = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        username: user?.username || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate save - replace with actual API call
        setTimeout(() => {
            setSuccess('Profile updated successfully');
            setIsSubmitting(false);
        }, 1000);
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Your Profile
                </Typography>

                <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                mr: 3,
                                bgcolor: 'primary.main',
                                fontSize: '2rem'
                            }}
                        >
                            {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                            <Typography variant="h5">
                                {user?.first_name} {user?.last_name}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {user?.username}
                            </Typography>
                        </Box>
                    </Box>

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    disabled
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 3 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <CircularProgress size={24} /> : 'Save Changes'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Profile;
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Container,
    Alert,
    CircularProgress
} from '@mui/material';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const { login, error } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!username.trim() || !password.trim()) {
            setFormError('Username and password are required');
            return;
        }

        setIsSubmitting(true);
        try {
            await login(username, password);
            navigate('/dashboard', { replace: true });
        } catch (error) {
            setFormError('Failed to log in: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8 }}>
                <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography component="h1" variant="h5" gutterBottom>
                        Log in to Golf Tracker
                    </Typography>

                    {(error || formError) && (
                        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                            {formError || error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isSubmitting}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isSubmitting}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <CircularProgress size={24} /> : 'Log In'}
                        </Button>
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Typography variant="body2">
                                Don't have an account?{' '}
                                <Link to="/register" style={{ textDecoration: 'none' }}>
                                    Register here
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;
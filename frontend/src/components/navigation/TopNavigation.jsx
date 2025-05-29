import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Box,
    Avatar,
    Menu,
    MenuItem,
    Divider
} from '@mui/material';
import {
    Menu as MenuIcon,
    AccountCircle,
    Logout,
    Person
} from '@mui/icons-material';

const TopNavigation = ({ onDrawerToggle }) => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleProfile = () => {
        handleClose();
        navigate('/profile');
    };

    const handleLogout = () => {
        handleClose();
        logout();
        navigate('/login');
    };

    return (
        <AppBar position="fixed">
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={onDrawerToggle}
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>

                <Typography
                    variant="h6"
                    component={RouterLink}
                    to="/"
                    sx={{
                        flexGrow: 1,
                        textDecoration: 'none',
                        color: 'inherit'
                    }}
                >
                    Golf Tracker
                </Typography>

                {isAuthenticated ? (
                    <Box>
                        <IconButton
                            onClick={handleMenu}
                            color="inherit"
                            size="large"
                        >
                            {user?.first_name ? (
                                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                    {user.first_name.charAt(0)}
                                </Avatar>
                            ) : (
                                <AccountCircle />
                            )}
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            <MenuItem disabled>
                                <Typography variant="body2" color="text.secondary">
                                    Signed in as <strong>{user?.username}</strong>
                                </Typography>
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleProfile}>
                                <Person fontSize="small" sx={{ mr: 1 }} />
                                Profile
                            </MenuItem>
                            <MenuItem onClick={handleLogout}>
                                <Logout fontSize="small" sx={{ mr: 1 }} />
                                Logout
                            </MenuItem>
                        </Menu>
                    </Box>
                ) : (
                    <Button
                        color="inherit"
                        component={RouterLink}
                        to="/login"
                    >
                        Login
                    </Button>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default TopNavigation;
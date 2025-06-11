import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Typography, Button, Container, Grid, Card, CardContent,
    Box, Paper, List, ListItem, ListItemIcon, ListItemText,
    AppBar, Toolbar, useTheme, useMediaQuery
} from '@mui/material';
import {
    Check as CheckIcon,
    EmojiEvents as TrophyIcon,
    GolfCourse as CourseIcon,
    Group as GroupIcon,
    BarChart as AnalyticsIcon,
    Schedule as ScheduleIcon,
    Score as ScoreIcon,
    Star as StarIcon,
    AccountBox as MemberIcon,
    Event as EventIcon,
    Restaurant as DiningIcon,
    Payment as PaymentIcon
} from '@mui/icons-material';

const Marketing = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        // Smooth scrolling for navigation links
        const handleAnchorClick = (e) => {
            e.preventDefault();
            const target = document.querySelector(e.currentTarget.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        };

        const anchors = document.querySelectorAll('a[href^="#"]');
        anchors.forEach(anchor => {
            anchor.addEventListener('click', handleAnchorClick);
        });

        return () => {
            anchors.forEach(anchor => {
                anchor.removeEventListener('click', handleAnchorClick);
            });
        };
    }, []);

    const features = [
        {
            icon: <MemberIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
            title: 'Member Management',
            description: 'Complete member database with profiles, handicaps, membership status, and communication tools'
        },
        {
            icon: <TrophyIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
            title: 'League & Competition Management',
            description: 'Organize leagues, tournaments, and competitions with flexible formats and automated scheduling'
        },
        {
            icon: <EventIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
            title: 'Event Management',
            description: 'Plan and manage all clubhouse events from golf tournaments to social gatherings and dining events'
        },
        {
            icon: <CourseIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
            title: 'Tee Time & Course Management',
            description: 'Online tee time booking system with course maintenance scheduling and pace of play tracking'
        },
        {
            icon: <ScoreIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
            title: 'Scoring & Handicap System',
            description: 'Real-time scoring with USGA handicap calculations and performance analytics for all members'
        },
        {
            icon: <PaymentIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
            title: 'Pro Shop & Billing',
            description: 'Integrated pro shop management with member billing, dues tracking, and payment processing'
        }
    ];

    const membershipFeatures = [
        '👤 Member Profiles & Directory',
        '💳 Membership Dues & Billing',
        '📧 Member Communication Hub',
        '🏌️ Handicap Tracking & GHIN Integration',
        '📱 Mobile Member App',
        '🎯 Member Achievement System'
    ];

    const eventFeatures = [
        { title: '🏆 Golf Tournaments', desc: 'Full tournament management from registration to awards ceremonies' },
        { title: '🎉 Social Events', desc: 'Manage club parties, dinners, and member social gatherings' },
        { title: '🍽️ Dining Events', desc: 'Special dining experiences and wine tastings with reservation management' },
        { title: '⛳ Golf Clinics', desc: 'Pro-led instruction sessions and group lessons with signup tracking' },
        { title: '👥 Member-Guest Events', desc: 'Special events for members to bring guests with pricing tiers' },
        { title: '📅 Recurring Events', desc: 'Automated scheduling for weekly leagues and monthly events' }
    ];

    const operationsFeatures = [
        'Tee time reservation system with member preferences',
        'Pro shop inventory and point-of-sale integration',
        'Food & beverage management with member charging',
        'Course maintenance scheduling and notifications',
        'Staff scheduling and communication tools',
        'Financial reporting and member account management',
        'Club governance and committee management',
        'Equipment rental and locker management'
    ];

    const pricingPlans = [
        {
            name: 'Club Starter',
            price: 149,
            features: [
                'Up to 200 members',
                'Basic member management',
                'Tee time reservations',
                'Simple event management',
                'Email support',
                'Mobile member access',
                'Basic reporting'
            ],
            highlighted: false
        },
        {
            name: 'Full Clubhouse',
            price: 349,
            features: [
                'Unlimited members',
                'Complete member management',
                'Advanced tournament system',
                'Pro shop integration',
                'F&B management',
                'Custom member portal',
                'Priority support',
                'Advanced analytics'
            ],
            highlighted: true
        },
        {
            name: 'Championship Club',
            price: 699,
            features: [
                'Multi-course support',
                'Custom integrations',
                'White-label mobile app',
                'Dedicated account manager',
                'GHIN integration',
                'Custom reporting',
                'API access',
                'Training & onboarding'
            ],
            highlighted: false
        }
    ];

    return (
        <Box sx={{ bgcolor: 'background.default' }}>
            {/* Header */}
            <AppBar
                position="static"
                sx={{
                    background: 'linear-gradient(135deg, #2e7d32, #4caf50)',
                    boxShadow: '0 2px 10px rgba(46, 125, 50, 0.3)'
                }}
            >
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                        🏌️ GolfClubTrack.com
                    </Typography>
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
                        <Button
                            color="inherit"
                            href="#features"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    borderRadius: 1
                                }
                            }}
                        >
                            Features
                        </Button>
                        <Button
                            color="inherit"
                            href="#membership"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    borderRadius: 1
                                }
                            }}
                        >
                            Membership
                        </Button>
                        <Button
                            color="inherit"
                            href="#events"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    borderRadius: 1
                                }
                            }}
                        >
                            Events
                        </Button>
                        <Button
                            color="inherit"
                            href="#operations"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    borderRadius: 1
                                }
                            }}
                        >
                            Operations
                        </Button>
                        <Button
                            color="inherit"
                            href="#pricing"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    borderRadius: 1
                                }
                            }}
                        >
                            Pricing
                        </Button>
                    </Box>
                    <Button
                        component={Link}
                        to="/login"
                        variant="outlined"
                        color="inherit"
                        sx={{
                            ml: 2,
                            borderColor: 'rgba(255,255,255,0.5)',
                            '&:hover': {
                                borderColor: 'white',
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }
                        }}
                    >
                        Login
                    </Button>
                </Toolbar>
            </AppBar>

            {/* Hero Section */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
                    color: 'white',
                    py: { xs: 8, md: 12 },
                    textAlign: 'center'
                }}
            >
                <Container maxWidth="md">
                    <Box sx={{ fontSize: '4rem', mb: 2 }}>🏌️⛳</Box>
                    <Typography
                        variant={isMobile ? "h3" : "h2"}
                        gutterBottom
                        sx={{
                            fontWeight: 'bold',
                            mb: 3,
                            lineHeight: 1.2
                        }}
                    >
                        Golf Club Management
                        <br />
                        <Typography
                            component="span"
                            variant={isMobile ? "h4" : "h3"}
                            sx={{
                                color: '#ffeb3b',
                                fontWeight: 'normal',
                                display: 'block',
                                mt: 1
                            }}
                        >
                            Made Simple
                        </Typography>
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 4,
                            opacity: 0.9,
                            maxWidth: '600px',
                            mx: 'auto',
                            lineHeight: 1.4
                        }}
                    >
                        Everything your golf club needs in one platform:
                        members, tournaments, events, tee times & more
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                            component={Link}
                            to="/login"
                            variant="contained"
                            size="large"
                            sx={{
                                bgcolor: 'warning.main',
                                color: 'white',
                                px: 4,
                                py: 1.5,
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                '&:hover': {
                                    bgcolor: 'warning.dark'
                                }
                            }}
                        >
                            Start Free Trial
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            sx={{
                                borderColor: 'white',
                                color: 'white',
                                px: 4,
                                py: 1.5,
                                fontSize: '1.1rem',
                                '&:hover': {
                                    borderColor: 'white',
                                    bgcolor: 'rgba(255,255,255,0.1)'
                                }
                            }}
                            href="#features"
                        >
                            See Features
                        </Button>
                    </Box>
                </Container>
            </Box>

            {/* Features Section */}
            <Container maxWidth="lg" sx={{ py: 8 }} id="features">
                <Typography variant="h3" align="center" gutterBottom sx={{ mb: 6 }}>
                    Complete Clubhouse Management
                </Typography>
                <Grid container spacing={4}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} md={6} lg={4} key={index}>
                            <Card
                                sx={{
                                    height: '100%',
                                    textAlign: 'center',
                                    transition: 'transform 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 3
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ mb: 2 }}>
                                        {feature.icon}
                                    </Box>
                                    <Typography variant="h6" gutterBottom>
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {feature.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Member Management Section */}
            <Box sx={{ bgcolor: 'grey.50', py: 8 }} id="membership">
                <Container maxWidth="lg">
                    <Typography variant="h3" align="center" gutterBottom sx={{ mb: 6 }}>
                        Member Experience & Management
                    </Typography>
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Typography variant="h4" gutterBottom color="primary">
                                Everything Your Members Need
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3 }}>
                                Create an exceptional member experience with comprehensive profiles,
                                easy communication, and seamless access to all club amenities.
                            </Typography>
                            <Grid container spacing={2}>
                                {membershipFeatures.map((feature, index) => (
                                    <Grid item xs={12} sm={6} key={index}>
                                        <Paper
                                            sx={{
                                                p: 2,
                                                textAlign: 'center',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Typography variant="body1">
                                                {feature}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    bgcolor: 'primary.main',
                                    color: 'white'
                                }}
                            >
                                <Typography variant="h4" gutterBottom>
                                    📱 Member Mobile App
                                </Typography>
                                <Box sx={{ fontSize: '4rem', my: 2 }}>👥</Box>
                                <Typography variant="body1">
                                    Give your members 24/7 access to book tee times, view their handicap,
                                    register for events, and stay connected with the club community.
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Events & Tournament Section */}
            <Container maxWidth="lg" sx={{ py: 8 }} id="events">
                <Typography variant="h3" align="center" gutterBottom sx={{ mb: 6 }}>
                    Events & Tournament Management
                </Typography>
                <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
                    From major tournaments to casual social events, manage every aspect of your club's calendar
                </Typography>
                <Grid container spacing={3}>
                    {eventFeatures.map((feature, index) => (
                        <Grid item xs={12} md={6} key={index}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom color="primary">
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {feature.desc}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Operations Section */}
            <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }} id="operations">
                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Typography variant="h3" gutterBottom>
                                Streamlined Club Operations
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3 }}>
                                Integrate all aspects of your club operations from the pro shop to the dining room,
                                with real-time reporting and member account management.
                            </Typography>
                            <List>
                                {operationsFeatures.map((feature, index) => (
                                    <ListItem key={index} sx={{ py: 0.5 }}>
                                        <ListItemIcon>
                                            <CheckIcon sx={{ color: 'warning.main' }} />
                                        </ListItemIcon>
                                        <ListItemText primary={feature} />
                                    </ListItem>
                                ))}
                            </List>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    bgcolor: 'background.paper'
                                }}
                            >
                                <Typography variant="h4" gutterBottom color="primary">
                                    💼 Pro Shop Integration
                                </Typography>
                                <Box sx={{ fontSize: '4rem', my: 2 }}>🏪</Box>
                                <Typography variant="body1" color="text.secondary">
                                    Complete point-of-sale system with inventory management,
                                    member charging, and integrated financial reporting.
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Pricing Section */}
            <Container maxWidth="lg" sx={{ py: 8 }} id="pricing">
                <Typography variant="h3" align="center" gutterBottom sx={{ mb: 2 }}>
                    Choose Your Club's Plan
                </Typography>
                <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
                    Scalable solutions for golf clubs of all sizes
                </Typography>
                <Grid container spacing={4} justifyContent="center">
                    {pricingPlans.map((plan, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <Card
                                sx={{
                                    height: '100%',
                                    position: 'relative',
                                    border: plan.highlighted ? 2 : 0,
                                    borderColor: 'primary.main',
                                    transform: plan.highlighted ? 'scale(1.05)' : 'none'
                                }}
                            >
                                {plan.highlighted && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: -10,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            bgcolor: 'warning.main',
                                            color: 'white',
                                            px: 2,
                                            py: 0.5,
                                            borderRadius: 1,
                                            fontSize: '0.875rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        MOST POPULAR
                                    </Box>
                                )}
                                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="h5" gutterBottom>
                                        {plan.name}
                                    </Typography>
                                    <Typography variant="h3" color="primary" sx={{ mb: 3 }}>
                                        ${plan.price}
                                        <Typography component="span" variant="h6" color="text.secondary">
                                            /month
                                        </Typography>
                                    </Typography>
                                    <List sx={{ mb: 3 }}>
                                        {plan.features.map((feature, featureIndex) => (
                                            <ListItem key={featureIndex} sx={{ py: 0.5 }}>
                                                <ListItemIcon>
                                                    <CheckIcon color="primary" />
                                                </ListItemIcon>
                                                <ListItemText primary={feature} />
                                            </ListItem>
                                        ))}
                                    </List>
                                    <Button
                                        component={Link}
                                        to="/login"
                                        variant={plan.highlighted ? "contained" : "outlined"}
                                        size="large"
                                        fullWidth
                                        sx={{
                                            bgcolor: plan.highlighted ? 'primary.main' : 'transparent',
                                            '&:hover': {
                                                bgcolor: plan.highlighted ? 'primary.dark' : 'primary.main',
                                                color: 'white'
                                            }
                                        }}
                                    >
                                        {plan.name === 'Championship Club' ? 'Contact Sales' : 'Get Started'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Footer */}
            <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 6 }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={3}>
                            <Typography variant="h6" gutterBottom>
                                Product
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Button color="inherit" href="#features" sx={{ justifyContent: 'flex-start' }}>
                                    Features
                                </Button>
                                <Button color="inherit" href="#pricing" sx={{ justifyContent: 'flex-start' }}>
                                    Pricing
                                </Button>
                                <Button color="inherit" href="#events" sx={{ justifyContent: 'flex-start' }}>
                                    Events
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Typography variant="h6" gutterBottom>
                                Support
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Button color="inherit" sx={{ justifyContent: 'flex-start' }}>
                                    Help Center
                                </Button>
                                <Button color="inherit" sx={{ justifyContent: 'flex-start' }}>
                                    Training
                                </Button>
                                <Button color="inherit" sx={{ justifyContent: 'flex-start' }}>
                                    Contact Support
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Typography variant="h6" gutterBottom>
                                Solutions
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Button color="inherit" sx={{ justifyContent: 'flex-start' }}>
                                    Private Clubs
                                </Button>
                                <Button color="inherit" sx={{ justifyContent: 'flex-start' }}>
                                    Public Courses
                                </Button>
                                <Button color="inherit" sx={{ justifyContent: 'flex-start' }}>
                                    Resort Golf
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Typography variant="h6" gutterBottom>
                                Company
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Button color="inherit" sx={{ justifyContent: 'flex-start' }}>
                                    About Us
                                </Button>
                                <Button color="inherit" sx={{ justifyContent: 'flex-start' }}>
                                    Contact Sales
                                </Button>
                                <Button color="inherit" sx={{ justifyContent: 'flex-start' }}>
                                    Privacy Policy
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                    <Box sx={{ textAlign: 'center', mt: 4, pt: 4, borderTop: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                        <Typography variant="body2">
                            © 2025 GolfClubTrack.com. All rights reserved. Transform your entire golf club experience.
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default Marketing;
import React from 'react';
import TopNavigation from '../navigation/TopNavigation';
import { useLocation } from 'react-router-dom';

const MainLayout = ({ children }) => {
    const location = useLocation();

    // Check if we're on the score entry page
    const isScoreEntryPage = location.pathname.includes('/match/') &&
        location.pathname.includes('/score/');

    return (
        <>
            {!isScoreEntryPage && <TopNavigation />}
            <main>
                {children}
            </main>
            {/* Footer if you have one */}
        </>
    );
};

export default MainLayout;
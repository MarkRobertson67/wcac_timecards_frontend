// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

// utils/TimeAndDateUtils.js

export const formatDate = (dateString) => {
    if (!dateString) return '';
    // Convert ISO string to local date string
    const date = new Date(dateString);
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString(undefined, options);
};


export const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hrs = parseInt(hours);
    const period = hrs >= 12 ? 'PM' : 'AM';
    const adjustedHours = hrs % 12 || 12;  // Converts "00" to "12" for AM and "13" to "1" for PM
    return `${adjustedHours}:${minutes} ${period}`;
};

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
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(`1970-01-01T${timeString}Z`).toLocaleTimeString(undefined, options);
};

  
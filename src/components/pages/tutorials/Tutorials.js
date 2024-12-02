// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

function AboutComponent() {
    return (
        <div>
            <br />
            <br />
            <h1 style={{ textAlign: 'center' }}>Welcome to the timecards tutorials page</h1>
            <p style={{ textAlign: 'center', marginTop: '20px' }}>
                To learn how to create a new account and verify your email, please visit the guide:
                <br />
                <a
                    href="https://scribehow.com/shared/How_to_Sign_Up_and_Verify_Your_WCAC_Account__1XqE3DCjS_y8xMZd_6Q9aQ"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'blue', textDecoration: 'underline' }}
                >
                    How to Create a New Account Online
                </a>
            </p>
            <p style={{ textAlign: 'center', marginTop: '20px' }}>
                To learn more about how to create a new time card online, please visit the guide:
                <br />
                <a
                    href="https://scribehow.com/shared/How_To_Create_A_New_Time_Card_Online__QVlOmQ_QRFS0ejBRGI5GPQ"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'blue', textDecoration: 'underline' }}
                >
                    How to Create a New Time Card Online
                </a>
            </p>
        </div>
    );
}

export default AboutComponent;

# **App Name**: CodeForge

## Core Features:

- Real-time Collaborative Editing: Enables multiple users to simultaneously edit the same code files, with cursor and selection rendering for each participant. This relies on integrating Yjs.
- Session Management: Allows users to create, join, and manage coding sessions with different access modes (open or approval required), participant limits, and default permissions.
- Integrated Chat: Provides a real-time chat panel for session participants to communicate, fostering seamless collaboration.
- Code Execution: Allows users to execute code directly within the IDE and view the results in an output panel.
- User Authentication and Authorization: Securely manages user logins, registration, and session access, leveraging Firebase Authentication. Firebase authorization is used to manage user roles and permissions.
- Role-Based Access Control: Enables the session host to assign roles (Host, Co-Host, Editor, Viewer) to participants, controlling their permissions within the session, such as code editing or execution.
- AI Assistance tool: When run, this tool automatically identifies frequently occurring blocks of code within the current file, suggests the user considers abstracting those into composable components with clear interfaces and then it edits those pieces of code.
- File CRUD: Enables users to perform Create, Read, Update, and Delete operations on files on the host's local machine.
- Local Machine CMD Access: Provides access to the host's local machine's command-line interface.
- Local File System Access: Allows users to access and interact with the host's local machine's file system.

## Style Guidelines:

- Primary color: Cobalt Blue (#3B79C9) to reflect collaboration and innovation. Chosen for its versatile, saturated, and accessible character that works well with dark UI themes. Cobalt Blue represents collaboration and harmony which reflects the application goal.
- Background color: Dark Slate Gray (#303A46) to create a modern coding-focused atmosphere.
- Accent color: Teal (#34A7A7), used for highlights and active states. A lighter, contrasting teal provides visibility against the Cobalt and slate colors
- Headline Font: 'Space Grotesk', sans-serif. Body Font: 'Inter', sans-serif
- Code font: 'Source Code Pro' for displaying code snippets.
- Use minimalist icons from a consistent set, with intuitive representations for file actions, collaboration features, and status indicators.
- Maintain a consistent layout across all views, with a clear hierarchy and logical grouping of elements, optimized for coding efficiency.
- Incorporate subtle animations for state transitions and feedback, such as cursor movements, notifications, and loading indicators, to enhance user experience.
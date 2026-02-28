export type FileNode = {
  name: string;
  children?: FileNode[];
  isOpen?: boolean;
};

export const fileTree: FileNode[] = [
  {
    name: 'src',
    isOpen: true,
    children: [
      {
        name: 'app',
        isOpen: true,
        children: [
            { name: 'page.tsx' }, 
            { name: 'layout.tsx' },
            { name: 'globals.css' }
        ],
      },
      {
        name: 'components',
        isOpen: true,
        children: [
          { name: 'button.tsx' },
          { name: 'card.tsx' },
          { name: 'dialog.tsx' },
        ],
      },
      { name: 'index.tsx' },
    ],
  },
  {
    name: 'public',
    children: [{ name: 'favicon.ico' }, { name: 'vercel.svg' }],
  },
  { name: 'package.json' },
  { name: 'tailwind.config.ts' },
];

export const participants = [
    { id: 1, name: 'You', role: 'Host' as const, avatarId: 'avatar1' },
    { id: 2, name: 'Alex', role: 'Co-Host' as const, avatarId: 'avatar2' },
    { id: 3, name: 'Jordan', role: 'Editor' as const, avatarId: 'avatar3' },
    { id: 4, name: 'Taylor', role: 'Editor' as const, avatarId: 'avatar4' },
    { id: 5, name: 'Casey', role: 'Viewer' as const, avatarId: 'avatar5' },
];

export const chatMessages = [
    { id: 1, participantId: 2, message: "Hey everyone, ready to get started?", timestamp: "10:00 AM" },
    { id: 2, participantId: 3, message: "Yep, I'm looking at the `button.tsx` component.", timestamp: "10:01 AM" },
    { id: 3, participantId: 1, message: "Great! I'll start working on the main layout file.", timestamp: "10:01 AM" },
    { id: 4, participantId: 4, message: "Can someone give me editor permissions?", timestamp: "10:02 AM" },
    { id: 5, participantId: 1, message: "Done, Taylor. You should be able to edit now.", timestamp: "10:03 AM" },
];

export const initialCode = `import React from 'react';

type ButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
};

function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  const baseStyle = 'px-4 py-2 rounded-md font-semibold';
  const variantStyle = variant === 'primary' 
    ? 'bg-blue-500 text-white' 
    : 'bg-gray-200 text-black';
  return (
    <button className={\`\${baseStyle} \${variantStyle}\`} onClick={onClick}>
      {children}
    </button>
  );
}

function App() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Welcome to our App</h1>
      
      {/* Primary Action */}
      <div className="mb-4">
        <h2 className="text-lg">Main Action</h2>
        <p className="mb-2">Click this button to perform the main action.</p>
        <button className="px-4 py-2 rounded-md font-semibold bg-blue-500 text-white" onClick={() => console.log('Primary action clicked')}>
          Submit
        </button>
      </div>

      {/* Secondary Action */}
      <div>
        <h2 className="text-lg">Secondary Action</h2>
        <p className="mb-2">This is an alternative action.</p>
        <button className="px-4 py-2 rounded-md font-semibold bg-gray-200 text-black" onClick={() => console.log('Secondary action clicked')}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default App;
`;

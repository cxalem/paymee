# How to Connect Your Repository to Cursor

## Method 1: Open an Existing Local Repository

If you already have a repository cloned locally:

1. **Open Cursor**
2. **File → Open Folder** (or `Ctrl+K, Ctrl+O`)
3. **Navigate to your repository directory** and select it
4. **Click "Open"**

Cursor will automatically detect if it's a Git repository and enable Git integration.

## Method 2: Clone a Remote Repository

If your repository is hosted on GitHub, GitLab, or another Git service:

1. **Open Cursor**
2. **View → Command Palette** (or `Ctrl+Shift+P`)
3. **Type "Git: Clone"** and select it
4. **Enter the repository URL** (e.g., `https://github.com/username/repo.git`)
5. **Choose a local directory** where you want to clone the repository
6. **Click "Clone"**
7. **Open the cloned repository** when prompted

## Method 3: Using the Terminal in Cursor

1. **Open Cursor**
2. **Terminal → New Terminal** (or `Ctrl+` `)
3. **Navigate to desired directory:**
   ```bash
   cd /path/to/your/projects
   ```
4. **Clone your repository:**
   ```bash
   git clone https://github.com/username/repo.git
   ```
5. **Open the repository:**
   ```bash
   code repo-name
   ```

## Method 4: Direct Integration with Git Services

### GitHub Integration:
1. **File → Preferences → Settings** (or `Ctrl+,`)
2. **Search for "GitHub"**
3. **Enable GitHub integration**
4. **Sign in to GitHub** when prompted
5. **Command Palette → "GitHub: Clone Repository"**

### GitLab Integration:
1. **Install GitLab extension** from the Extensions marketplace
2. **Configure GitLab settings** in preferences
3. **Use Command Palette** to clone repositories

## Setting Up Your Workspace

Once connected:

1. **Cursor will automatically detect:**
   - Git repository status
   - Branch information
   - File changes
   - Commit history

2. **Key features available:**
   - Source control panel (`Ctrl+Shift+G`)
   - Git blame annotations
   - Diff viewing
   - Branch switching
   - Commit and push capabilities

## Useful Cursor Commands for Git

- **View changes:** `Ctrl+Shift+G`
- **Commit changes:** `Ctrl+Enter` (in Source Control)
- **Create new branch:** Command Palette → "Git: Create Branch"
- **Switch branch:** Command Palette → "Git: Checkout to"
- **View Git history:** Command Palette → "Git: View History"

## Troubleshooting

### Repository Not Detected:
- Ensure the folder contains a `.git` directory
- Check if Git is installed on your system
- Verify repository permissions

### Authentication Issues:
- Set up SSH keys for easier authentication
- Use personal access tokens for HTTPS
- Configure Git credentials locally

### Performance Issues:
- Add large files to `.gitignore`
- Use `.cursorignore` for files you don't want Cursor to index
- Consider using Git LFS for large binary files

## Additional Tips

1. **Use .cursorignore** to exclude files from Cursor's indexing
2. **Set up workspace settings** for project-specific configurations
3. **Configure Git hooks** for automated tasks
4. **Use Cursor's AI features** for code suggestions and explanations

Your repository should now be fully connected to Cursor with all Git functionality available!
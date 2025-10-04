# Contributing to ForensicFlow

Thank you for your interest in contributing to ForensicFlow! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:
1. Check if the issue already exists
2. Provide a clear and descriptive title
3. Include steps to reproduce the problem
4. Specify your environment (OS, Python/Node version, etc.)
5. Attach relevant logs or screenshots

### Suggesting Features

We love new ideas! When suggesting a feature:
1. Check if it's already been suggested
2. Clearly describe the feature and its benefits
3. Explain the use case
4. Consider how it fits with existing features

## 💻 Development Process

### Setting Up Development Environment

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/forensicflow.git
   cd forensicflow
   ```

2. **Set up backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   ```

3. **Set up frontend**
   ```bash
   cd client
   npm install
   ```

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test your changes**
   ```bash
   # Backend
   cd backend
   python manage.py test
   
   # Frontend
   cd client
   npm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

### Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add natural language entity extraction
fix: resolve case deletion cascade issue
docs: update API documentation for queries endpoint
```

### Submitting Pull Requests

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template

3. **PR Requirements**
   - Clear description of changes
   - Link to related issues
   - All tests passing
   - No merge conflicts
   - Documentation updated if needed

## 📝 Code Style Guidelines

### Python (Backend)

- Follow [PEP 8](https://pep8.org/) style guide
- Use meaningful variable names
- Maximum line length: 120 characters
- Use docstrings for functions and classes
- Type hints are encouraged

Example:
```python
def extract_entities(text: str, entity_types: list[str]) -> dict:
    """
    Extract entities from text based on specified types.
    
    Args:
        text: The input text to analyze
        entity_types: List of entity types to extract
        
    Returns:
        Dictionary with entity types as keys and lists of entities as values
    """
    # Implementation
    pass
```

### TypeScript/React (Frontend)

- Use TypeScript for type safety
- Follow [Airbnb React Style Guide](https://github.com/airbnb/javascript/tree/master/react)
- Use functional components with hooks
- Use meaningful component and variable names
- Keep components small and focused

Example:
```typescript
interface CaseCardProps {
  case: Case;
  onSelect: (id: string) => void;
}

export const CaseCard: React.FC<CaseCardProps> = ({ case, onSelect }) => {
  // Implementation
};
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
python manage.py test
```

Write tests for:
- Models
- API endpoints
- Utility functions
- Entity extraction logic

### Frontend Tests

```bash
cd client
npm test
```

Test:
- Component rendering
- User interactions
- API calls
- State management

## 📚 Documentation

When adding new features:
1. Update relevant README files
2. Add docstrings/comments
3. Update API documentation
4. Add examples if applicable

## 🔍 Code Review Process

Pull requests will be reviewed for:
- Code quality and style
- Test coverage
- Documentation
- Security considerations
- Performance implications

Reviewers may request changes. Please address them promptly.

## 🛡️ Security

If you discover a security vulnerability:
1. **DO NOT** create a public issue
2. Email the maintainers directly
3. Provide details of the vulnerability
4. Allow time for a fix before public disclosure

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙋 Getting Help

- Check existing issues and documentation
- Ask questions in GitHub Discussions
- Join our community channels

## 🌟 Recognition

Contributors will be:
- Listed in the project contributors
- Credited in release notes
- Acknowledged in documentation

Thank you for making ForensicFlow better! 🎉


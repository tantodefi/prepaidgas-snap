import styled from 'styled-components';

export const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.background?.default};
  color: ${({ theme }) => theme.colors.text?.default};
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary?.default};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary?.muted};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text?.muted};
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.background?.default};
  color: ${({ theme }) => theme.colors.text?.default};
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary?.default};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary?.muted};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text?.default};
  margin-bottom: 0.5rem;
`;

export const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

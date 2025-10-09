import React from 'react';
import styled from 'styled-components';

import {
  ConnectButton,
  InstallFlaskButton,
  ReconnectButton,
  Card,
} from '../components';
import { PrepaidConfig } from '../components/PrepaidConfig';
import { defaultSnapOrigin } from '../config';
import { useMetaMask, useMetaMaskContext, useRequestSnap } from '../hooks';
import { isLocalSnap, shouldDisplayReconnectButton } from '../utils';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 4rem;
  margin-bottom: 4rem;
  padding: 0 2rem;
  ${({ theme }) => theme.mediaQueries.small} {
    margin-top: 2rem;
    margin-bottom: 2rem;
    padding: 0 1rem;
  }
`;

const Heading = styled.h1`
  margin-top: 0;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 3rem;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: 2rem;
  }
`;

const Span = styled.span`
  color: ${(props) => props.theme.colors.primary?.default};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: 400;
  margin-top: 0;
  margin-bottom: 3rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.text?.muted};
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
    margin-bottom: 2rem;
  }
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 64.8rem;
  width: 100%;
  gap: 1.5rem;
  margin-top: 1.5rem;
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error?.muted};
  border: 1px solid ${({ theme }) => theme.colors.error?.default};
  color: ${({ theme }) => theme.colors.error?.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 1.5rem;
  width: 100%;
  max-width: 500px;
`;

const Index = () => {
  const { error } = useMetaMaskContext();
  const { isFlask, snapsDetected, installedSnap } = useMetaMask();
  const requestSnap = useRequestSnap();

  const isMetaMaskReady = isLocalSnap(defaultSnapOrigin)
    ? isFlask
    : snapsDetected;

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 Index page state:', {
      isMetaMaskReady,
      isFlask,
      snapsDetected,
      installedSnap: !!installedSnap,
      shouldReconnect: shouldDisplayReconnectButton(installedSnap),
    });
  }, [isMetaMaskReady, isFlask, snapsDetected, installedSnap]);

  return (
    <Container>
      <Heading>
        Prepaid <Span>Gas</Span> Snap
      </Heading>
      <Subtitle>
        Manage prepaid gas coupons and enable gasless transactions
      </Subtitle>

      <CardContainer>
        {error && (
          <ErrorMessage>
            <b>Error:</b> {error.message}
          </ErrorMessage>
        )}

        {/* Step 1: Install Flask */}
        {!isMetaMaskReady && (
          <Card
            content={{
              title: '1. Install MetaMask Flask',
              description:
                "MetaMask Flask is required to use snaps. It's a canary distribution for developers with access to upcoming features.",
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}

        {/* Step 2: Connect Snap */}
        {isMetaMaskReady && !installedSnap && (
          <Card
            content={{
              title: '2. Connect to Snap',
              description:
                'Install and connect the Prepaid Gas Snap to start managing your gas coupons.',
              button: (
                <ConnectButton
                  onClick={requestSnap}
                  disabled={!isMetaMaskReady}
                />
              ),
            }}
            fullWidth
          />
        )}

        {/* Connection Success + Dev Mode */}
        {installedSnap && (
          <Card
            content={{
              title: shouldDisplayReconnectButton(installedSnap)
                ? '✓ Snap Connected - Development Mode'
                : '✓ Snap Connected',
              description: shouldDisplayReconnectButton(installedSnap)
                ? 'Successfully connected! Click Reconnect to reload snap after code changes.'
                : 'Successfully connected to Prepaid Gas Snap!',
              button: shouldDisplayReconnectButton(installedSnap) ? (
                <ReconnectButton
                  onClick={requestSnap}
                  disabled={!installedSnap}
                />
              ) : undefined,
            }}
            fullWidth
          />
        )}

        {installedSnap && (
          <Card
            content={{
              title: '3. Configure & Test',
              description:
                'Add prepaid gas coupons and test gasless transactions.',
            }}
            fullWidth
          >
            <PrepaidConfig />
          </Card>
        )}
      </CardContainer>
    </Container>
  );
};

export default Index;

        <Card
          content={{
            title: 'Send Hello message',
            description:
              'Display a custom message within a confirmation screen in MetaMask.',
            button: (
              <SendHelloButton
                onClick={handleSendHelloClick}
                disabled={!installedSnap}
              />
            ),
          }}
          disabled={!installedSnap}
          fullWidth={
            isMetaMaskReady &&
            Boolean(installedSnap) &&
            !shouldDisplayReconnectButton(installedSnap)
          }
        />
        <Notice>
          <p>
            Please note that the <b>snap.manifest.json</b> and{' '}
            <b>package.json</b> must be located in the server root directory and
            the bundle must be hosted at the location specified by the location
            field.
          </p>
        </Notice>
      </CardContainer>
    </Container>
  );
};

export default Index;

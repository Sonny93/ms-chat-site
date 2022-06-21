import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';

import { useRouter } from 'next/router';

import nProgress from 'nprogress';
import 'nprogress/nprogress.css';

import AuthRequired from '../components/AuthRequired';
import SocketManager from '../components/SocketManager';

import '../styles/globals.scss';
import { Provider } from 'react-redux';
import { store } from '../lib/Redux';

function MyApp({
	Component,
	pageProps: { session, ...pageProps }
}) {
	const router = useRouter();

	console.log('render')

	useEffect(() => { // Chargement pages
		router.events.on('routeChangeStart', nProgress.start);
		router.events.on('routeChangeComplete', nProgress.done);
		router.events.on('routeChangeError', nProgress.done);

		return () => {
			router.events.off('routeChangeStart', nProgress.start);
			router.events.off('routeChangeComplete', nProgress.done);
			router.events.off('routeChangeError', nProgress.done);
		}
	});

	return (
		<SessionProvider session={session}>
			{Component.authRequired ? (
				<AuthRequired>
					<Provider store={store}>
						<SocketManager
							Component={Component}
							pageProps={pageProps}
						/>
					</Provider>
				</AuthRequired>
			) : (
				<Component {...pageProps} />
			)}
		</SessionProvider>
	)
}

export default MyApp;

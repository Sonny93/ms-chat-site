import { getProviders, signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import Head from 'next/head';
import { Provider } from 'next-auth/providers';

export default function SignIn({ providers }: { providers: Provider[]; }) {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return (
            <div className='App' style={{ alignItems: 'center' }}>
                <p style={{ height: 'fit-content' }}>Chargement de la session en cours</p>
            </div>
        );
    }

    return (<>
        <Head>
            <title>oui</title>
        </Head>
        <div className='App'>
            <div>
                <div className='providers'>
                    {Object.values(providers).map(({ name, id }) => (
                        <button key={id} onClick={() => signIn(id, { callbackUrl: '/' })} disabled={session !== null}>
                            Continuer avec {name}
                        </button>
                    ))}
                </div>
                <Link href='/'>
                    <a>← Revenir à l'accueil</a>
                </Link>
            </div>
        </div>
    </>);
}

export async function getServerSideProps(context) {
    const providers = await getProviders();
    return {
        props: { providers }
    }
}
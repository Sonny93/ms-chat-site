import { Provider } from "next-auth/providers";
import { getProviders, signIn, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";

export default function SignIn({ providers }: { providers: Provider[] }) {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="App" style={{ alignItems: "center" }}>
                <p style={{ height: "fit-content" }}>
                    Chargement de la session en cours
                </p>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>oui</title>
            </Head>
            <div className="App">
                <div>
                    <div className="providers">
                        {Object.values(providers).map(({ name, id }) => (
                            <button
                                key={id}
                                onClick={() => signIn(id, { callbackUrl: "/" })}
                                disabled={session !== null}
                            >
                                Continuer avec {name}
                            </button>
                        ))}
                    </div>
                    <Link href="/">← Revenir à l'accueil</Link>
                </div>
            </div>
        </>
    );
}

export async function getServerSideProps(context) {
    const providers = await getProviders();
    return {
        props: { providers },
    };
}

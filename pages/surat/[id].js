import Head from 'next/head'
import { useEffect, useContext, useState } from 'react';

import { mapAyatObjectToArray, getAyatNumberList } from '../../utils/utils';
import { getSurahNameAndAyat, getAllSurahId, getSurah, getMurottalUrl } from '../../data-sources/data-sources';
import { Context } from '../../state/store';
import { setCurrentMurottal, murottalAudioToggle, setCurrentAyatNumberList, setLoadingTrue, setLoadingFalse } from '../../state/actions';

import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';
import LoadingSpinner from '../../components/loading-spinner/loading-spinner';
import AyatListItem from '../../components/ayat-list/ayat-list-item';

export const getStaticPaths = async () => {
  const paths = await getAllSurahId();
  return {
    paths,
    fallback: false,
  };
}

export const getStaticProps = async ({ params }) => {
  const { nextName, previousName } = await getSurahNameAndAyat(params.id);
  const murottalUrl = await getMurottalUrl(params.id);

  return {
    props: {
      surahId: params.id,
      nextName,
      previousName,
      murottalUrl,
    }
  };
}

const SurahDetail = ({ surahId, murottalUrl, nextName, previousName }) => {
  const [state, dispatch] = useContext(Context);
  const { currentMurottal, isMurottalPlaying, isLoading } = state;
  
  const [surah, setSurah] = useState({
    versesArray: [],
    name_latin: '',
    number_of_ayah: '',
    number: null,
  });

  const { versesArray, name_latin, number_of_ayah, number } = surah;

  const fetchSurah = async () => {
    dispatch(setLoadingTrue());
    const response = await getSurah(surahId);
    const { text, translations, number, name_latin, number_of_ayah } = response;
    const verses = mapAyatObjectToArray(text, translations.id.text);

    setSurah({
      versesArray: verses,
      name_latin,
      number,
      number_of_ayah,
    });

    setAyatList(verses);

    dispatch(setLoadingFalse());
  };

  const setAyatList = (verses) => {
    dispatch(setCurrentAyatNumberList(getAyatNumberList(verses)));
  };

  const dispatchCurrentMurottal = async () => {
    if (isMurottalPlaying === true) {
      dispatch(murottalAudioToggle());
    }
    dispatch(setCurrentMurottal(murottalUrl));
  };
  
  useEffect(() => {
    fetchSurah();
    dispatchCurrentMurottal();
  }, [surahId]);

  return (
    <>
      <Head>
        <title>Quran Surat {name_latin ? name_latin : ''} | QuranKu</title>
        <link
            rel="preload"
            href="/fonts/LPMQ.ttf"
            as="font"
            crossOrigin=""
          />
      </Head>

      <Header pageTitle={name_latin ? `${name_latin} | ${number_of_ayah} ayat` : 'Loading...'} />
        {
          isLoading
            ? <LoadingSpinner />
            : <main style={{ width: '95%', marginLeft: 'auto', marginRight: 'auto' }} className='my-16'>
                <ul>
                  <li className='mb-5 border-b pb-3'>
                    <div className='flex flex-col'>
                      <div className='grid'>
                        <p className='arabic-text col-start-2 ml-auto mr-0 text-right'>بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
                      </div>
                      <p className='mt-10 text-gray-700 leading-relaxed text-justify'>Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.</p>
                    </div>
                  </li>
                  {versesArray.map((ayat) => <AyatListItem key={ayat.ayatNumber} surahId={surahId} surahName={name_latin} {...ayat} /> )}
                </ul>
                <audio id="audio-murottal" src={currentMurottal} loop={true} />
              </main>
        }
      {
        number
          ? <Footer
              previousId={(parseInt(number) - 1).toString()} 
              nextId={(parseInt(number) + 1).toString()} 
              previousName={previousName} 
              nextName={nextName}
            />
          : <Footer
              previousId={null} 
              nextId={null} 
              previousName='Loading' 
              nextName='Loading'
            />
      }
    </>
  );
};

export default SurahDetail;
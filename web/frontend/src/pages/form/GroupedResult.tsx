import React, { FC, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { DownloadedResults, RankResults, SelectResults, TextResults } from 'types/form';
import SelectResult from './components/SelectResult';
import RankResult from './components/RankResult';
import TextResult from './components/TextResult';
import {
  ID,
  RANK,
  RankQuestion,
  SELECT,
  SUBJECT,
  SelectQuestion,
  Subject,
  SubjectElement,
  TEXT,
} from 'types/configuration';
import DownloadButton from 'components/buttons/DownloadButton';
import { useTranslation } from 'react-i18next';
import saveAs from 'file-saver';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router';
import useForm from 'components/utils/useForm';
import { useConfigurationOnly } from 'components/utils/useConfiguration';
import {
  countRankResult,
  countSelectResult,
  countTextResult,
} from './components/utils/countResult';

// Functional component that displays the result of the votes
const GroupedResult: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formId } = useParams();

  const { loading, result, configObj } = useForm(formId);
  const configuration = useConfigurationOnly(configObj);

  const [rankResult, setRankResult] = useState<RankResults>(null);
  const [selectResult, setSelectResult] = useState<SelectResults>(null);
  const [textResult, setTextResult] = useState<TextResults>(null);

  // Group the different results by the ID of the question,
  const groupByID = (
    resultMap: Map<ID, number[][] | string[][]>,
    IDs: ID[],
    results: boolean[][] | number[][] | string[][],
    toNumber: boolean = false
  ) => {
    IDs.forEach((id, index) => {
      let updatedRes = [];
      let res = results[index];

      // SelectResult are mapped to 0 or 1s, such that ballots can be
      // counted more efficiently
      if (toNumber) {
        res = (results[index] as boolean[]).map((r: boolean) => (r ? 1 : 0));
      }

      if (resultMap.has(id)) {
        updatedRes = resultMap.get(id);
      }

      updatedRes.push(res);
      resultMap.set(id, updatedRes);
    });
  };

  const groupResultsByID = () => {
    let selectRes: SelectResults = new Map<ID, number[][]>();
    let rankRes: RankResults = new Map<ID, number[][]>();
    let textRes: TextResults = new Map<ID, string[][]>();

    result.forEach((res) => {
      if (
        res.SelectResultIDs !== null &&
        res.RankResultIDs !== null &&
        res.TextResultIDs !== null
      ) {
        groupByID(selectRes, res.SelectResultIDs, res.SelectResult, true);
        groupByID(rankRes, res.RankResultIDs, res.RankResult);
        groupByID(textRes, res.TextResultIDs, res.TextResult);
      }
    });

    return { rankRes, selectRes, textRes };
  };

  useEffect(() => {
    if (result !== null) {
      const { rankRes, selectRes, textRes } = groupResultsByID();

      setRankResult(rankRes);
      setSelectResult(selectRes);
      setTextResult(textRes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const getResultData = (subject: Subject, dataToDownload: DownloadedResults[]) => {
    dataToDownload.push({ Title: subject.Title });

    subject.Order.forEach((id: ID) => {
      const element = subject.Elements.get(id);
      let res = undefined;

      switch (element.Type) {
        case RANK:
          const rank = element as RankQuestion;

          if (rankResult.has(id)) {
            res = countRankResult(rankResult.get(id), element as RankQuestion).resultsInPercent.map(
              (percent, index) => {
                return { Candidate: rank.Choices[index], Percentage: `${percent}%` };
              }
            );
            dataToDownload.push({ Title: element.Title, Results: res });
          }
          break;

        case SELECT:
          const select = element as SelectQuestion;

          if (selectResult.has(id)) {
            res = countSelectResult(selectResult.get(id)).resultsInPercent.map((percent, index) => {
              return { Candidate: select.Choices[index], Percentage: `${percent}%` };
            });
            dataToDownload.push({ Title: element.Title, Results: res });
          }
          break;

        case SUBJECT:
          getResultData(element as Subject, dataToDownload);
          break;

        case TEXT:
          if (textResult.has(id)) {
            res = Array.from(countTextResult(textResult.get(id)).resultsInPercent).map((r) => {
              return { Candidate: r[0], Percentage: `${r[1]}%` };
            });
            dataToDownload.push({ Title: element.Title, Results: res });
          }
          break;
      }
    });
  };

  const exportJSONData = () => {
    const fileName = 'result.json';

    const dataToDownload: DownloadedResults[] = [];

    configuration.Scaffold.forEach((subject: Subject) => {
      getResultData(subject, dataToDownload);
    });

    const data = {
      Title: configuration.MainTitle,
      NumberOfVotes: result.length,
      Results: dataToDownload,
    };

    const fileToSave = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });

    saveAs(fileToSave, fileName);
  };

  const SubjectElementResultDisplay = (element: SubjectElement) => {
    return (
      <div className="pl-4 pb-4 sm:pl-6 sm:pb-6">
        <h2 className="text-lg pb-2">{element.Title}</h2>
        {element.Type === RANK && rankResult.has(element.ID) && (
          <RankResult rank={element as RankQuestion} rankResult={rankResult.get(element.ID)} />
        )}
        {element.Type === SELECT && selectResult.has(element.ID) && (
          <SelectResult
            select={element as SelectQuestion}
            selectResult={selectResult.get(element.ID)}
          />
        )}
        {element.Type === TEXT && textResult.has(element.ID) && (
          <TextResult textResult={textResult.get(element.ID)} />
        )}
      </div>
    );
  };

  const displayResults = (subject: Subject) => {
    console.log(rankResult);
    return (
      <div key={subject.ID}>
        <h2 className="text-xl pt-1 pb-1 sm:pt-2 sm:pb-2 border-t font-bold text-gray-600">
          {subject.Title}
        </h2>
        {subject.Order.map((id: ID) => (
          <div key={id}>
            {subject.Elements.get(id).Type === SUBJECT ? (
              <div className="pl-4 sm:pl-6">
                {displayResults(subject.Elements.get(id) as Subject)}
              </div>
            ) : (
              SubjectElementResultDisplay(subject.Elements.get(id))
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col">
        {configuration.Scaffold.map((subject: Subject) => displayResults(subject))}
      </div>
      <div className="flex my-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-gray-700 my-2 mr-2 items-center px-4 py-2 border rounded-md text-sm hover:text-indigo-500">
          {t('back')}
        </button>

        <DownloadButton exportData={exportJSONData}>{t('exportJSON')}</DownloadButton>
      </div>
    </div>
  );
};

GroupedResult.propTypes = {
  location: PropTypes.any,
};

export default GroupedResult;

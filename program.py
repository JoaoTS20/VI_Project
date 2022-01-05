import csv

def parserTSVDict(document):
    file= open(document, encoding='utf-8', mode='rt')
    return csv.DictReader(file, delimiter=",")


def main():
        file=parserTSVDict("dataset.csv")
        rows=[]
        fieldnames=["id","budget","genres","original_language","original_title","overview","popularity","poster_path","production_companies","production_countries","release_date","revenue","spoken_languages","title","director"
]
        s={}
        d=[]
        for row in file:
            for a in eval(row["production_countries"]):
                d.append(a)
        for x in sorted(set(d)):
            print(x)

if __name__ == "__main__":
    main()
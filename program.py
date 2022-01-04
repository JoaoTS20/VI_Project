import csv

def parserTSVDict(document):
    file= open(document, encoding='utf-8', mode='rt')
    return csv.DictReader(file, delimiter=",")


def main():
        file=parserTSVDict("dataset.csv")
        rows=[]
        fieldnames=["id","budget","genres","original_language","original_title","overview","popularity","poster_path","production_companies","production_countries","release_date","revenue","spoken_languages","title","director"
]
        for row in file:
            if float(row["budget"]) > 0:
                rows.append(row)
        with open("newcsv.csv","w", encoding='UTF8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

if __name__ == "__main__":
    main()